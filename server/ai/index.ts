import type { LLMProvider } from "./provider.interface";
import { GemmaProvider } from "./gemma.provider";
import { MockProvider } from "./mock.provider";

let currentProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (currentProvider) {
    return currentProvider;
  }

  const isProd = process.env.NODE_ENV === "production";
  const providerType = (process.env.LLM_PROVIDER || "gemma").toLowerCase().trim();

  // In production, mock provider is strictly forbidden
  if (isProd && providerType === "mock") {
    throw new Error(
      "[FATAL CONFIGURATION ERROR] LLM_PROVIDER=mock is forbidden in production! " +
        "You must configure a real Gemma endpoint via local Ollama or hosted API."
    );
  }

  // During automated unit tests, default to MockProvider unless USE_REAL_LLM is set
  if (process.env.NODE_ENV === "test" && !process.env.USE_REAL_LLM && providerType !== "gemma") {
    return new MockProvider();
  }

  if (providerType === "mock") {
    currentProvider = new MockProvider();
  } else {
    currentProvider = new GemmaProvider();
  }

  return currentProvider;
}

export function setLLMProvider(provider: LLMProvider | null): void {
  currentProvider = provider;
}

export * from "./provider.interface";
export * from "./gemma.provider";
export * from "./mock.provider";
