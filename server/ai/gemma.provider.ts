import type { LLMProvider, GenerateJSONOptions } from "./provider.interface";

export class GemmaProvider implements LLMProvider {
  readonly providerName = "gemma";
  readonly modelName: string;
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  lastSuccessfulCallTime: string | null = null;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");
    this.modelName = process.env.LLM_MODEL || "gemma2:9b";
    this.apiKey = process.env.LLM_API_KEY || undefined;
  }

  /**
   * Checks if configured model supports vision/image inputs.
   */
  supportsVision(): boolean {
    const m = this.modelName.toLowerCase();
    return m.includes("pali") || m.includes("vision") || m.includes("llava") || m.includes("vl");
  }

  /**
   * Probes LLM endpoint reachability.
   */
  async checkReachable(): Promise<{ reachable: boolean; error?: string }> {
    try {
      const isOllama = this.baseUrl.includes("11434") || this.baseUrl.endsWith("/api");
      const url = isOllama
        ? (this.baseUrl.endsWith("/api") ? `${this.baseUrl}/tags` : `${this.baseUrl}/api/tags`)
        : `${this.baseUrl}/models`;
      const headers: Record<string, string> = {};
      if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(3500) });
      if (!res.ok) return { reachable: false, error: `HTTP ${res.status}` };
      return { reachable: true };
    } catch (err) {
      return { reachable: false, error: (err as Error).message };
    }
  }

  private cleanJsonString(raw: string): string {
    let text = raw.trim();
    if (text.startsWith("```json")) {
      text = text.slice(7);
    } else if (text.startsWith("```")) {
      text = text.slice(3);
    }
    if (text.endsWith("```")) {
      text = text.slice(0, -3);
    }
    return text.trim();
  }

  private async callEndpoint(messages: Array<{ role: string; content: string; images?: string[] }>): Promise<string> {
    const isOllama = this.baseUrl.includes("11434") || this.baseUrl.endsWith("/api");
    const endpoint = isOllama
      ? (this.baseUrl.endsWith("/api") ? `${this.baseUrl}/chat` : `${this.baseUrl}/api/chat`)
      : `${this.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const payload = isOllama
      ? {
          model: this.modelName,
          messages,
          format: "json",
          stream: false,
          options: { temperature: 0.1 },
        }
      : {
          model: this.modelName,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 1024,
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM provider error (${res.status} ${res.statusText}): ${errText}`);
    }

    const data = await res.json();
    if (isOllama) {
      return data.message?.content || "";
    } else {
      return data.choices?.[0]?.message?.content || "";
    }
  }

  async generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T> {
    const systemInstruction =
      options.system ||
      "You are an accurate, deterministic packaging specification extraction engine. Output strictly valid JSON matching the requested schema. Never invent or hallucinate data.";

    let imagesPayload: string[] | undefined = undefined;
    let textPrompt = options.prompt;

    if (options.images && options.images.length > 0) {
      if (this.supportsVision()) {
        imagesPayload = options.images.map((img) => img.base64);
      } else {
        textPrompt += `\n\n[Note: Reference image attachment provided (${options.images[0].filename || "image"}), but current model "${this.modelName}" does not support vision. Falling back to text extraction.]`;
      }
    }

    const messages = [
      { role: "system", content: systemInstruction },
      {
        role: "user",
        content: textPrompt,
        ...(imagesPayload ? { images: imagesPayload } : {}),
      },
    ];

    let rawOutput: string;
    try {
      rawOutput = await this.callEndpoint(messages);
    } catch (endpointErr) {
      throw new Error(
        `AI provider unavailable (mock disabled): Could not connect to ${this.baseUrl} (${(endpointErr as Error).message}). ` +
          `Ensure Ollama is running or configure hosted LLM_BASE_URL & LLM_API_KEY.`
      );
    }

    // Attempt 1: Parse JSON
    try {
      const cleaned = this.cleanJsonString(rawOutput);
      const parsed = JSON.parse(cleaned) as T;
      this.lastSuccessfulCallTime = new Date().toISOString();
      return parsed;
    } catch {
      // Retry once per Phase 4 requirement
      const retryMessages = [
        ...messages,
        { role: "assistant", content: rawOutput },
        {
          role: "user",
          content:
            "The previous response was not valid JSON. Please fix syntax errors and output ONLY the valid JSON object without markdown or commentary.",
        },
      ];

      rawOutput = await this.callEndpoint(retryMessages);
      try {
        const cleaned = this.cleanJsonString(rawOutput);
        const parsed = JSON.parse(cleaned) as T;
        this.lastSuccessfulCallTime = new Date().toISOString();
        return parsed;
      } catch (finalErr) {
        throw new Error(`Failed to parse valid JSON from Gemma model after retry: ${(finalErr as Error).message}`);
      }
    }
  }
}
