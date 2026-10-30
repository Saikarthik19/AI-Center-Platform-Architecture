import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  getUserCredentials,
  saveUserCredential,
  deleteUserCredential,
} from "@/lib/db";
import { providerRegistry } from "@/lib/providers/registry";

const saveKeySchema = z.object({
  providerSlug: z.string(),
  apiKey: z.string().min(5, "API Key must be at least 5 characters"),
  extraConfig: z.record(z.string()).optional(),
  validateFirst: z.boolean().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";
  const credentials = await getUserCredentials(userId);
  return NextResponse.json({ credentials });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user";

    const body = await req.json();
    const validated = saveKeySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { providerSlug, apiKey, extraConfig, validateFirst } = validated.data;
    const adapter = providerRegistry.get(providerSlug);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unsupported provider: ${providerSlug}` },
        { status: 404 }
      );
    }

    if (validateFirst) {
      const testResult = await adapter.testConnection(apiKey, extraConfig);
      if (!testResult.success) {
        return NextResponse.json(
          {
            error: "Connection verification failed. Key was not saved.",
            details: testResult.message,
          },
          { status: 400 }
        );
      }
    }

    const saved = await saveUserCredential(userId, providerSlug, apiKey, extraConfig);

    return NextResponse.json({
      success: true,
      message: `Successfully connected and encrypted API key for ${adapter.name}`,
      credential: {
        id: saved.id,
        providerSlug,
        keyMask: saved.keyMask,
        isValid: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to securely save API key", message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user";

    const { searchParams } = new URL(req.url);
    const providerSlug = searchParams.get("provider");

    if (!providerSlug) {
      return NextResponse.json(
        { error: "Provider parameter is required" },
        { status: 400 }
      );
    }

    await deleteUserCredential(userId, providerSlug);

    return NextResponse.json({
      success: true,
      message: `Successfully disconnected provider ${providerSlug}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to disconnect provider", message: err.message },
      { status: 500 }
    );
  }
}
