import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getActiveApiKey, recordUsage, addMessageToConversation } from "@/lib/db";
import { providerRegistry } from "@/lib/providers/registry";
import { normalizeProviderError } from "@/lib/providers/ssrf";

const chatRequestSchema = z.object({
  providerSlug: z.string(),
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    })
  ),
  conversationId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(32000).optional(),
  systemPrompt: z.string().optional(),
  stream: z.boolean().default(true),
  extraConfig: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let userId = "demo-user";
  let providerSlug = "";
  let model = "";

  try {
    const user = await getCurrentUser();
    if (user) userId = user.id;

    const body = await req.json();
    const validated = chatRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid chat payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const {
      providerSlug: pSlug,
      model: mModel,
      messages,
      conversationId,
      temperature,
      maxTokens,
      systemPrompt,
      stream,
      extraConfig,
    } = validated.data;

    providerSlug = pSlug;
    model = mModel;

    const adapter = providerRegistry.get(providerSlug);
    if (!adapter) {
      return NextResponse.json(
        { error: `Provider '${providerSlug}' is not supported.` },
        { status: 400 }
      );
    }

    const apiKey = await getActiveApiKey(userId, providerSlug);
    if (!apiKey) {
      return NextResponse.json(
        {
          error: `No API key connected for ${adapter.name}.`,
          code: "MISSING_KEY",
          suggestedAction: `Go to the API Key Center to connect your ${adapter.name} API key. You can get an official key for free at ${adapter.keySignupUrl}`,
        },
        { status: 401 }
      );
    }

    // Save user message to conversation if conversationId is provided
    if (conversationId && messages.length > 0) {
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg.role === "user") {
        await addMessageToConversation(conversationId, {
          role: "user",
          content: lastUserMsg.content,
          modelId: model,
        });
      }
    }

    const providerReq = {
      apiKey,
      model,
      messages,
      temperature,
      maxTokens,
      systemPrompt,
      extraConfig,
    };

    if (stream) {
      try {
        const streamResponse = await adapter.chatStream(providerReq);

        // Record usage asynchronously
        recordUsage({
          userId,
          providerId: providerSlug,
          modelId: model,
          promptTokens: Math.round(messages.reduce((acc, m) => acc + m.content.length / 4, 0)),
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: Date.now() - startTime,
          status: "success",
        }).catch(() => {});

        return new Response(streamResponse, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      } catch (streamErr: any) {
        // Fall back to complete or return normalized error
        const normalized = normalizeProviderError(streamErr, adapter.name);
        return NextResponse.json(
          {
            error: normalized.message,
            code: normalized.code,
            suggestedAction: normalized.suggestedAction,
          },
          { status: normalized.statusCode }
        );
      }
    }

    // Non-streaming completion
    const completion = await adapter.chatComplete(providerReq);

    // Save assistant response message
    if (conversationId) {
      await addMessageToConversation(conversationId, {
        role: "assistant",
        content: completion.content,
        tokenUsagePrompt: completion.usage?.promptTokens,
        tokenUsageCompletion: completion.usage?.completionTokens,
        latencyMs: completion.latencyMs,
        modelId: model,
      });
    }

    await recordUsage({
      userId,
      providerId: providerSlug,
      modelId: model,
      promptTokens: completion.usage?.promptTokens || 0,
      completionTokens: completion.usage?.completionTokens || 0,
      totalTokens: completion.usage?.totalTokens || 0,
      latencyMs: completion.latencyMs,
      status: "success",
    });

    return NextResponse.json({
      content: completion.content,
      model: completion.model,
      usage: completion.usage,
      latencyMs: completion.latencyMs,
      finishReason: completion.finishReason,
    });
  } catch (err: any) {
    const adapter = providerRegistry.get(providerSlug);
    const normalized = normalizeProviderError(err, adapter?.name || providerSlug || "Provider");

    await recordUsage({
      userId,
      providerId: providerSlug,
      modelId: model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startTime,
      status: "error",
      errorMessage: normalized.message,
    }).catch(() => {});

    return NextResponse.json(
      {
        error: normalized.message,
        code: normalized.code,
        suggestedAction: normalized.suggestedAction,
      },
      { status: normalized.statusCode }
    );
  }
}
