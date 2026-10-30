import {
  ProviderAdapter,
  ProviderChatRequest,
  ProviderChatResponse,
  ConnectionTestResult,
} from "../types";
import { validateTargetUrl } from "../ssrf";

export class GoogleAdapter implements ProviderAdapter {
  slug = "google";
  name = "Google Gemini";
  defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
  allowedHosts = ["generativelanguage.googleapis.com"];
  docsUrl = "https://ai.google.dev/docs";
  keySignupUrl = "https://aistudio.google.com/app/apikey";

  async testConnection(apiKey: string): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    try {
      const url = validateTargetUrl(`${this.defaultBaseUrl}/models?key=${encodeURIComponent(apiKey)}`);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.error?.message || `Google API returned status ${response.status}`,
          latencyMs,
        };
      }

      const modelsCount = data.models?.length || 0;
      return {
        success: true,
        message: `Successfully verified Google Gemini credentials. Found ${modelsCount} available models.`,
        latencyMs,
        modelsFound: modelsCount,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || "Failed to reach Google Gemini API",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async chatComplete(request: ProviderChatRequest): Promise<ProviderChatResponse> {
    const startTime = Date.now();
    const model = request.model.startsWith("models/") ? request.model : `models/${request.model}`;
    const url = validateTargetUrl(
      `${this.defaultBaseUrl}/${model}:generateContent?key=${encodeURIComponent(request.apiKey)}`
    );

    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const latencyMs = Date.now() - startTime;
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Google Gemini request failed: HTTP ${response.status}`);
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || "";

    return {
      content: text,
      model: request.model,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      latencyMs,
      finishReason: candidate?.finishReason,
    };
  }

  async chatStream(request: ProviderChatRequest): Promise<ReadableStream<Uint8Array>> {
    const model = request.model.startsWith("models/") ? request.model : `models/${request.model}`;
    const url = validateTargetUrl(
      `${this.defaultBaseUrl}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(request.apiKey)}`
    );

    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const body: Record<string, any> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      },
    };

    if (request.systemPrompt) {
      body.systemInstruction = {
        parts: [{ text: request.systemPrompt }],
      };
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Gemini stream failed: HTTP ${response.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error("No response body available for streaming from Google Gemini");
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
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                try {
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                    );
                  }
                } catch {
                  // Skip invalid JSON lines
                }
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
