import { z } from "zod";

export interface GenerateJSONOptions<T = unknown> {
  system?: string;
  prompt: string;
  schema?: z.ZodType<T> | Record<string, unknown>;
  images?: Array<{
    base64: string;
    mimeType: string;
    filename?: string;
  }>;
}

export interface LLMProvider {
  readonly providerName: string;
  readonly modelName: string;
  lastSuccessfulCallTime?: string | null;
  
  /**
   * Checks whether the current configured model and endpoint support multimodal vision inputs.
   */
  supportsVision(): boolean;

  /**
   * Checks if the endpoint is reachable.
   */
  checkReachable?(): Promise<{ reachable: boolean; error?: string }>;

  /**
   * Generates structured JSON adhering to the specified schema or instructions.
   * Retries once on invalid JSON syntax before failing.
   */
  generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T>;
}
