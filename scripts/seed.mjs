import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PROVIDERS = [
  {
    slug: "google",
    name: "Google Gemini API",
    description: "Multimodal frontier models developed by Google DeepMind with context windows up to 2M tokens.",
    officialWebsite: "https://ai.google.dev",
    docsUrl: "https://ai.google.dev/gemini-api/docs",
    keySignupUrl: "https://aistudio.google.com/app/apikey",
    freeTierSummary: "Generous recurring free tier: 15 RPM, 1M TPM, 1,500 RPD for Gemini 1.5 Flash in AI Studio.",
    isConfigurable: true,
    isOfficial: true,
  },
  {
    slug: "groq",
    name: "Groq LPU Inference Engine",
    description: "Ultra-low-latency LPU inference delivering hundreds of tokens per second for leading open-weight models.",
    officialWebsite: "https://groq.com",
    docsUrl: "https://console.groq.com/docs/quickstart",
    keySignupUrl: "https://console.groq.com/keys",
    freeTierSummary: "Free developer tier with up to 30 RPM and 6,000 to 14,400 TPM across open models.",
    isConfigurable: true,
    isOfficial: true,
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    description: "Unified AI gateway routing requests to 200+ models across dozens of hosting providers with automatic failover.",
    officialWebsite: "https://openrouter.ai",
    docsUrl: "https://openrouter.ai/docs",
    keySignupUrl: "https://openrouter.ai/keys",
    freeTierSummary: "Includes dedicated :free variants of top open-weights models (e.g. Meta Llama, Gemma, DeepSeek).",
    isConfigurable: true,
    isOfficial: true,
  },
  {
    slug: "cloudflare",
    name: "Cloudflare Workers AI",
    description: "Serverless GPU-powered inference running across Cloudflare's global edge network in 300+ cities.",
    officialWebsite: "https://workers.cloudflare.com",
    docsUrl: "https://developers.cloudflare.com/workers-ai/",
    keySignupUrl: "https://dash.cloudflare.com/profile/api-tokens",
    freeTierSummary: "10,000 Neurons per day free on all Cloudflare accounts without credit card expiration.",
    isConfigurable: true,
    isOfficial: true,
  },
  {
    slug: "mistral",
    name: "Mistral AI",
    description: "Pioneering European AI laboratory creating state-of-the-art open-weights and frontier commercial models.",
    officialWebsite: "https://mistral.ai",
    docsUrl: "https://docs.mistral.ai",
    keySignupUrl: "https://console.mistral.ai/api-keys",
    freeTierSummary: "Experimentation tier: Free access to Mistral Small, NeMo, and Codestral on La Plateforme with 1 RPS limit.",
    isConfigurable: true,
    isOfficial: true,
  },
  {
    slug: "huggingface",
    name: "Hugging Face Inference",
    description: "The home of open-source machine learning, providing serverless inference for over 150,000 open models.",
    officialWebsite: "https://huggingface.co",
    docsUrl: "https://huggingface.co/docs/api-inference",
    keySignupUrl: "https://huggingface.co/settings/tokens",
    freeTierSummary: "Free Community Inference API with rate limits suitable for prototyping and research.",
    isConfigurable: true,
    isOfficial: true,
  },
];

async function main() {
  console.log("Seeding AI Center database...");

  // 1. Seed demo user
  const passwordHash = await bcrypt.hash("developer123", 10);
  const user = await prisma.user.upsert({
    where: { email: "developer@aicenter.dev" },
    update: {},
    create: {
      email: "developer@aicenter.dev",
      passwordHash,
      name: "AI Developer",
      role: "ADMIN",
    },
  });
  console.log(`Demo user verified: ${user.email}`);

  // 2. Seed providers
  for (const p of SEED_PROVIDERS) {
    await prisma.provider.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`Seeded ${SEED_PROVIDERS.length} providers.`);

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed failed (ensure PostgreSQL is running and DATABASE_URL is configured):", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
