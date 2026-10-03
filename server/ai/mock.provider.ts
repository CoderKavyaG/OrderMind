import type { LLMProvider, GenerateJSONOptions } from "./provider.interface";

export type MockHandler = (options: GenerateJSONOptions) => unknown;

export class MockProvider implements LLMProvider {
  readonly providerName = "mock";
  readonly modelName = "mock-gemma";
  private visionSupported = false;
  private responseQueue: unknown[] = [];
  private handlers: Array<{ pattern: RegExp | string; handler: MockHandler }> = [];
  public retryCount = 0;
  public callCount = 0;

  constructor(options?: { supportsVision?: boolean }) {
    this.visionSupported = options?.supportsVision ?? false;
  }

  supportsVision(): boolean {
    return this.visionSupported;
  }

  setSupportsVision(supported: boolean): void {
    this.visionSupported = supported;
  }

  enqueueResponse(response: unknown): void {
    this.responseQueue.push(response);
  }

  registerHandler(pattern: RegExp | string, handler: MockHandler): void {
    this.handlers.push({ pattern, handler });
  }

  async generateJSON<T>(options: GenerateJSONOptions<T>): Promise<T> {
    this.callCount++;

    // 1. Check if a response is queued
    if (this.responseQueue.length > 0) {
      const next = this.responseQueue.shift();
      if (typeof next === "function") {
        return (next as MockHandler)(options) as T;
      }
      if (next instanceof Error) {
        throw next;
      }
      return next as T;
    }

    // 2. Check registered handlers
    for (const { pattern, handler } of this.handlers) {
      const match = typeof pattern === "string" ? options.prompt.includes(pattern) : pattern.test(options.prompt);
      if (match) {
        return handler(options) as T;
      }
    }

    // 3. Fallback to default heuristic mock based on demo conversation golden fixtures
    const targetMatch =
      options.prompt.match(/(?:TARGET MESSAGE TO ANALYZE[\s\S]*?)?Content:\s*"([^"]+)"/i) ||
      options.prompt.match(/TARGET MESSAGE TO ANALYZE:\s*(?:Sender:[^\n]+\n)?\s*"([^"]+)"/i);
    const targetContent = (targetMatch ? targetMatch[1] : options.prompt).toLowerCase();

    // Stage 1: Field Extraction Golden Fixtures
    if (targetContent.includes("diwali gift hampers") || targetContent.includes("start with 100 units")) {
      return {
        events: [
          {
            field: "product_type",
            value: "rigid top-and-bottom box",
            op: "set",
            quote: "rigid top-and-bottom box",
            confidence: 0.95,
          },
          {
            field: "quantity",
            value: 100,
            unit: "units",
            op: "set",
            quote: "100 units",
            confidence: 0.98,
          },
        ],
      } as T;
    }

    if (targetContent.includes("change quantity from 100 to 500 units instead")) {
      return {
        events: [
          {
            field: "quantity",
            value: 500,
            unit: "units",
            op: "set",
            quote: "change quantity from 100 to 500 units instead",
            confidence: 0.99,
          },
        ],
      } as T;
    }

    if (targetContent.includes("metallic gold logo foil")) {
      return {
        events: [
          {
            field: "finish",
            value: "metallic gold foil",
            op: "set",
            quote: "metallic gold logo foil",
            confidence: 0.94,
          },
          {
            field: "logo_placement",
            value: "lid center",
            op: "set",
            quote: "lid center",
            confidence: 0.92,
          },
        ],
      } as T;
    }

    if (targetContent.includes("critical deadline is november 2nd")) {
      return {
        events: [
          {
            field: "deadline",
            value: "November 2nd",
            op: "set",
            quote: "November 2nd",
            confidence: 0.98,
          },
        ],
      } as T;
    }

    // Stage 2: Reference Interpretation ("same as last time", "a little taller")
    if (targetContent.includes("make it a little taller") || targetContent.includes("add about 2.5 cm")) {
      return {
        events: [
          {
            field: "height",
            value: "+2.5 cm",
            unit: "cm",
            op: "delta",
            rawPhrase: "make it a little taller? Add about 2.5 cm in height",
            quote: "make it a little taller? Add about 2.5 cm in height",
            confidence: 0.92,
          },
        ],
      } as T;
    }

    if (targetContent.includes("same as last time")) {
      return {
        events: [
          {
            field: "material",
            value: "dark navy textured kappa board",
            op: "ref",
            rawPhrase: "same as last time - that dark navy textured kappa board",
            quote: "same as last time",
            confidence: 0.95,
          },
        ],
      } as T;
    }

    // Dynamic General Packaging Parsing
    const events: Array<Record<string, unknown>> = [];

    if (targetContent.includes("rigid gift box") || targetContent.includes("rigid box") || targetContent.includes("shoulder box")) {
      events.push({
        field: "productType",
        value: "Rigid Box",
        op: "set",
        quote: targetContent.includes("rigid gift boxes") ? "rigid gift boxes" : "rigid box",
        confidence: 0.96,
      });
    } else if (targetContent.includes("corrugated mailer") || targetContent.includes("e-flute")) {
      events.push({
        field: "productType",
        value: "Corrugated Mailer",
        op: "set",
        quote: targetContent.includes("corrugated mailer boxes") ? "corrugated mailer boxes" : "mailer boxes",
        confidence: 0.97,
      });
    }

    if (targetContent.includes("500 boxes") || targetContent.includes("500 units") || targetContent.includes("to 500")) {
      events.push({
        field: "quantity",
        value: 500,
        unit: "units",
        op: "set",
        quote: targetContent.includes("500 boxes") ? "500 boxes" : "500",
        confidence: 0.99,
      });
    } else if (targetContent.includes("100 boxes") || targetContent.includes("100 units")) {
      events.push({
        field: "quantity",
        value: 100,
        unit: "units",
        op: "set",
        quote: targetContent.includes("100 boxes") ? "100 boxes" : "100 units",
        confidence: 0.98,
      });
    }

    const dimMatch = targetContent.match(/\b\d{2,4}\s*[xX]\s*\d{2,4}\s*[xX]\s*\d{2,4}(?:\s*mm)?\b/);
    if (dimMatch) {
      events.push({
        field: "dimensions",
        value: dimMatch[0],
        unit: "mm",
        op: "set",
        quote: dimMatch[0],
        confidence: 0.95,
      });
    }

    if (targetContent.includes("350 gsm white sbs") || targetContent.includes("350 gsm")) {
      events.push({
        field: "material",
        value: "350 GSM White SBS board",
        op: "set",
        quote: targetContent.includes("350 gsm white sbs board") ? "350 GSM White SBS board" : "350 GSM",
        confidence: 0.96,
      });
    }

    if (targetContent.includes("gold foil")) {
      events.push({
        field: "finish",
        value: "Gold Foil Stamping",
        op: "set",
        quote: targetContent.includes("gold foil logo stamping") ? "gold foil logo stamping" : "gold foil",
        confidence: 0.95,
      });
    }

    if (targetContent.includes("november 14th")) {
      events.push({
        field: "deadline",
        value: "November 14, 2026",
        op: "set",
        quote: "November 14th",
        confidence: 0.98,
      });
    }

    // Stage 3: Image Vision Specs
    if (options.images && options.images.length > 0) {
      if (!this.supportsVision()) {
        return {
          imageAnalyzed: false,
          reason: "Model does not support vision",
          events: [],
        } as T;
      }
      return {
        imageAnalyzed: true,
        description: "Navy blue rigid hamper box with central gold debossed foil logo.",
        events: [
          {
            field: "product_type",
            value: "rigid hamper box",
            op: "set",
            quote: "[Image Attachment]",
            confidence: 0.88,
          },
          {
            field: "finish",
            value: "gold foil debossing",
            op: "set",
            quote: "[Image Attachment]",
            confidence: 0.85,
          },
        ],
      } as T;
    }

    return { events } as T;
  }
}
