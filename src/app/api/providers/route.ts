import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogProviders, getUserCredentials } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";

  const providers = await getCatalogProviders();
  const userCreds = await getUserCredentials(userId);

  // Check server-side fallback envs
  const serverEnvs: Record<string, boolean> = {
    google: Boolean(process.env.GOOGLE_GEMINI_API_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
    mistral: Boolean(process.env.MISTRAL_API_KEY),
    cloudflare: Boolean(process.env.CLOUDFLARE_API_KEY),
    huggingface: Boolean(process.env.HUGGINGFACE_API_KEY),
  };

  const results = providers.map((p) => {
    const cred = userCreds.find((c: any) => c.providerSlug === p.slug || c.providerId === p.slug);
    return {
      ...p,
      isConnected: Boolean(cred?.isValid),
      keyMask: cred?.keyMask || null,
      lastTestedAt: cred?.lastTestedAt || null,
      hasServerKey: Boolean(serverEnvs[p.slug]),
    };
  });

  return NextResponse.json({ providers: results });
}
