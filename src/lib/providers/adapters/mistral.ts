import {
  ProviderAdapter,
  ProviderChatRequest,
  ProviderChatResponse,
  ConnectionTestResult,
} from "../types";
import { validateTargetUrl } from "../ssrf";

export class MistralAdapter implements ProviderAdapter {
  slug = "mistral";
  name = "Mistral AI";
  defaultBaseUrl = "https://api.mistral.ai/v1";
  allowedHosts = ["api.mistral.ai"];
  docsUrl = "https://docs.mistral.ai";
  keySignupUrl = "https://console.mistral.ai/api-keys";

  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const url = validateTargetUrl(`${this.defaultBaseUrl}/models`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || `Mistral AI returned status ${response.status}`,
          latencyMs,
        };
      }

      const modelsCount = data.data?.length || 0;
      return {
        success: true,
        message: `Successfully connected to Mistral AI. ${modelsCount} frontier models available.`,
        latencyMs,
        modelsFound: modelsCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach Mistral AI API",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async chatComplete(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const startTime = Date.now();
    const url = validateTargetUrl(`${this.defaultBaseUrl}/chat/completions`);

    const messages = [...request.messages];
    if (request.systemPrompt && !messages.some((m) => m.role === "system")) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: false,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Mistral AI request failed: HTTP ${response.status}`);
    }

    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || "",
      model: data.model || request.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      latencyMs,
      finishReason: choice?.finish_reason,
    };
  }

  async chatStream(request: ProviderChatRequest): Promise<ReadableStream<Uint8Array>> {
    const url = validateTargetUrl(`${this.defaultBaseUrl}/chat/completions`);

    const messages = [...request.messages];
    if (request.systemPrompt && !messages.some((m) => m.role === "system")) {
      messages.unshift({ role: "system", content: request.systemPrompt });
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Mistral stream failed: HTTP ${response.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("No response body stream received from Mistral AI");
    }

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const content = line.slice(6).trim();
              if (content === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
              try {
                const parsed = JSON.parse(content);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`)
                  );
                }
              } catch {
                // Ignore incomplete SSE json
              }
            }
          }
        } catch (err: any) {
          controller.error(err);
        }
      },
    });
  }
}
