export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderChatRequest {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  extraConfig?: Record<string, string>;
}

export interface ProviderChatResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  modelsFound?: number;
  details?: Record<string, any>;
}

export interface DiscoveredModel {
  id: string;
  name: string;
  contextWindow?: number;
  category?: string;
}

export interface ProviderAdapter {
  slug: string;
  name: string;
  defaultBaseUrl: string;
  allowedHosts: string[];
  docsUrl: string;
  keySignupUrl: string;
  testConnection(apiKey: string, extraConfig?: Record<string, string>): Promise<ConnectionTestResult>;
  chatComplete(request: ProviderChatRequest): Promise<ProviderChatResponse>;
  chatStream(request: ProviderChatRequest): Promise<ReadableStream<Uint8Array>>;
}

export interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  suggestedAction: string;
}
