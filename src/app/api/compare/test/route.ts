import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getActiveApiKey, getModelByIdOrSlug } from "@/lib/db";
import { providerRegistry } from "@/lib/providers/registry";

const compareSchema = z.object({
  modelSlugs: z.array(z.string()).min(2).max(4),
  prompt: z.string().min(1),
  systemPrompt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user";

    const body = await req.json();
    const validated = compareSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { modelSlugs, prompt, systemPrompt } = validated.data;

    // Run parallel tests across selected models
    const results = await Promise.allSettled(
      modelSlugs.map(async (slug) => {
        const modelInfo = (await getModelByIdOrSlug(slug)) as any;
        const providerSlug = modelInfo?.providerSlug || modelInfo?.provider?.slug || "google";
        const adapter = providerRegistry.get(providerSlug);

        if (!adapter) {
          throw new Error(`Provider for model '${slug}' is not supported`);
        }

        const apiKey = await getActiveApiKey(userId, providerSlug);
        if (!apiKey) {
          throw new Error(`No API key connected for ${adapter.name}. Configure in Key Center.`);
        }

        const res = await adapter.chatComplete({
          apiKey,
          model: slug,
          messages: [{ role: "user", content: prompt }],
          systemPrompt,
          temperature: 0.7,
          maxTokens: 1024,
        });

        return {
          slug,
          modelName: modelInfo?.name || slug,
          providerName: adapter.name,
          content: res.content,
          latencyMs: res.latencyMs,
          usage: res.usage,
          success: true,
        };
      })
    );

    const formatted = results.map((r, i) => {
      const slug = modelSlugs[i];
      if (r.status === "fulfilled") {
        return r.value;
      }
      return {
        slug,
        modelName: slug,
        providerName: "Unknown",
        content: "",
        latencyMs: 0,
        success: false,
        error: r.reason?.message || "Execution failed",
      };
    });

    return NextResponse.json({ results: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Comparison benchmark failed", message: err.message },
      { status: 500 }
    );
  }
}
