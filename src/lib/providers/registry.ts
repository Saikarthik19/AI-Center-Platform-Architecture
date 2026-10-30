import { ProviderAdapter } from "./types";
import { GoogleAdapter } from "./adapters/google";
import { GroqAdapter } from "./adapters/groq";
import { OpenRouterAdapter } from "./adapters/openrouter";
import { MistralAdapter } from "./adapters/mistral";
import { CloudflareAdapter } from "./adapters/cloudflare";
import { HuggingFaceAdapter } from "./adapters/huggingface";

class ProviderRegistry {
  private adapters: Map<string, ProviderAdapter> = new Map();

  constructor() {
    this.register(new GoogleAdapter());
    this.register(new GroqAdapter());
    this.register(new OpenRouterAdapter());
    this.register(new MistralAdapter());
    this.register(new CloudflareAdapter());
    this.register(new HuggingFaceAdapter());
  }

  register(adapter: ProviderAdapter) {
    this.adapters.set(adapter.slug, adapter);
  }

  get(slug: string): ProviderAdapter | undefined {
    return this.adapters.get(slug);
  }

  getAll(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  isSupported(slug: string): boolean {
    return this.adapters.has(slug);
  }
}

export const providerRegistry = new ProviderRegistry();
