import {
  ProviderAdapter,
  ProviderChatRequest,
  ProviderChatResponse,
  ConnectionTestResult,
} from "../types";
import { validateTargetUrl } from "../ssrf";

export class CloudflareAdapter implements ProviderAdapter {
  slug = "cloudflare";
  name = "Cloudflare Workers AI";
  defaultBaseUrl = "https://api.cloudflare.com/client/v4";
  allowedHosts = ["api.cloudflare.com"];
  docsUrl = "https://developers.cloudflare.com/workers-ai/";
  keySignupUrl = "https://dash.cloudflare.com/profile/api-tokens";

  async testConnection(apiKey: string, extraConfig?: Record<string, string>): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const url = validateTargetUrl(`${this.defaultBaseUrl}/user/tokens/verify`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.errors?.[0]?.message || `Cloudflare API token verification failed`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: `Successfully authenticated Cloudflare API token. Status: ${data.result?.status || "active"}`,
        latencyMs,
        details: data.result,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach Cloudflare API",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async chatComplete(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const startTime = Date.now();
    const accountId = request.extraConfig?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare Account ID is required. Please provide it in the API Key Center extra configuration or environment.");
    }

    const modelName = request.model.startsWith("@cf/") ? request.model : `@cf/${request.model}`;
    const url = validateTargetUrl(`${this.defaultBaseUrl}/accounts/${accountId}/ai/run/${modelName}`);

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
        messages,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.errors?.[0]?.message || `Cloudflare request failed: HTTP ${response.status}`);
    }

    const text = data.result?.response || "";
    return {
      content: text,
      model: request.model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      latencyMs,
    };
  }

  async chatStream(request: ProviderChatRequest): Promise<ReadableStream<Uint8Array>> {
    const accountId = request.extraConfig?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
    if (!accountId) {
      throw new Error("Cloudflare Account ID is required. Please configure it in API Key Center.");
    }

    const modelName = request.model.startsWith("@cf/") ? request.model : `@cf/${request.model}`;
    const url = validateTargetUrl(`${this.defaultBaseUrl}/accounts/${accountId}/ai/run/${modelName}`);

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
        messages,
        stream: true,
        max_tokens: request.maxTokens ?? 2048,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.errors?.[0]?.message || `Cloudflare streaming failed: HTTP ${response.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("No response body stream received from Cloudflare Workers AI");
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
                const text = parsed.response || "";
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
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
