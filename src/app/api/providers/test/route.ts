import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { providerRegistry } from "@/lib/providers/registry";
import { getActiveApiKey } from "@/lib/db";
import { normalizeProviderError } from "@/lib/providers/ssrf";
import { redactSecrets } from "@/lib/crypto";

const testSchema = z.object({
  providerSlug: z.string(),
  apiKey: z.string().optional(),
  extraConfig: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = testSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid test request", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { providerSlug, extraConfig } = validated.data;
    let apiKey = validated.data.apiKey;

    const adapter = providerRegistry.get(providerSlug);
    if (!adapter) {
      return NextResponse.json(
        { error: `Provider '${providerSlug}' is not supported.` },
        { status: 404 }
      );
    }

    // If apiKey wasn't sent in body, try retrieving the user's active key
    if (!apiKey) {
      const user = await getCurrentUser();
      const userId = user?.id || "demo-user";
      apiKey = (await getActiveApiKey(userId, providerSlug)) || undefined;
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: `No API key provided or found for ${adapter.name}. Please enter your key first.`,
        },
        { status: 400 }
      );
    }

    // Run connection test through adapter
    const result = await adapter.testConnection(apiKey, extraConfig);

    return NextResponse.json({
      success: result.success,
      message: redactSecrets(result.message),
      latencyMs: result.latencyMs,
      modelsFound: result.modelsFound,
      details: result.details,
    });
  } catch (err: any) {
    const normalized = normalizeProviderError(err, "Provider");
    return NextResponse.json(
      {
        success: false,
        error: normalized.message,
        suggestedAction: normalized.suggestedAction,
      },
      { status: normalized.statusCode }
    );
  }
}
