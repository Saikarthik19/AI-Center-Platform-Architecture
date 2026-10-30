import { PrismaClient } from "@prisma/client";
import { SEED_PROVIDERS, SEED_MODELS, ProviderSeed, ModelSeed } from "./seed-data";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../crypto";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

let isDbAvailable: boolean | null = null;

export async function checkDbConnection(): Promise<boolean> {
  if (isDbAvailable !== null) return isDbAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbAvailable = true;
    return true;
  } catch {
    isDbAvailable = false;
    return false;
  }
}

// In-Memory Fallback Store (Used when PostgreSQL is disconnected or in self-contained mode)
const inMemoryStore = {
  users: new Map<string, any>(),
  credentials: new Map<string, any>(),
  conversations: new Map<string, any>(),
  messages: new Map<string, any[]>(),
  favorites: new Set<string>(),
  usageRecords: [] as any[],
};

// Seed default test user in memory
inMemoryStore.users.set("demo-user", {
  id: "demo-user",
  email: "developer@aicenter.dev",
  name: "AI Developer",
  role: "USER",
  createdAt: new Date(),
  updatedAt: new Date(),
});

export async function getCatalogProviders() {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const providers = await prisma.provider.findMany({
        include: {
          _count: { select: { models: true } },
        },
        orderBy: { name: "asc" },
      });
      if (providers.length > 0) return providers;
    } catch {
      // Fall through to seed data
    }
  }

  return SEED_PROVIDERS.map((p) => ({
    id: p.slug,
    ...p,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: {
      models: SEED_MODELS.filter((m) => m.providerSlug === p.slug).length,
    },
  }));
}

export async function getCatalogModels(params?: {
  provider?: string;
  category?: string;
  freeTierStatus?: string;
  search?: string;
  sort?: string;
}) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const where: any = {};
      if (params?.provider) {
        where.provider = { slug: params.provider };
      }
      if (params?.category) {
        where.category = params.category;
      }
      if (params?.freeTierStatus) {
        where.freeTierStatus = params.freeTierStatus;
      }
      if (params?.search) {
        where.OR = [
          { name: { contains: params.search, mode: "insensitive" } },
          { slug: { contains: params.search, mode: "insensitive" } },
          { description: { contains: params.search, mode: "insensitive" } },
        ];
      }

      const models = await prisma.model.findMany({
        where,
        include: { provider: true },
        orderBy: { name: "asc" },
      });

      if (models.length > 0) return models;
    } catch {
      // Fall through to memory
    }
  }

  // Filter in-memory seed models
  let results = SEED_MODELS.map((m) => {
    const provider = SEED_PROVIDERS.find((p) => p.slug === m.providerSlug);
    return {
      id: m.slug,
      ...m,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastVerifiedAt: new Date(),
      provider: provider ? { id: provider.slug, ...provider } : null,
    };
  });

  if (params?.provider && params.provider !== "all") {
    results = results.filter((m) => m.providerSlug === params.provider);
  }
  if (params?.category && params.category !== "all") {
    results = results.filter((m) => m.category === params.category);
  }
  if (params?.freeTierStatus && params.freeTierStatus !== "all") {
    results = results.filter((m) => m.freeTierStatus === params.freeTierStatus);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }

  if (params?.sort === "price-low") {
    results.sort((a, b) => (a.inputPricingPerMillion ?? 999) - (b.inputPricingPerMillion ?? 999));
  } else if (params?.sort === "price-high") {
    results.sort((a, b) => (b.inputPricingPerMillion ?? 0) - (a.inputPricingPerMillion ?? 0));
  } else if (params?.sort === "context") {
    results.sort((a, b) => (b.contextWindow ?? 0) - (a.contextWindow ?? 0));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }

  return results;
}

export async function getModelByIdOrSlug(idOrSlug: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const model = await prisma.model.findFirst({
        where: {
          OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
        include: { provider: true },
      });
      if (model) return model;
    } catch {
      // Fall through
    }
  }

  const found = SEED_MODELS.find((m) => m.slug === idOrSlug);
  if (!found) return null;

  const provider = SEED_PROVIDERS.find((p) => p.slug === found.providerSlug);
  return {
    id: found.slug,
    ...found,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastVerifiedAt: new Date(),
    provider: provider ? { id: provider.slug, ...provider } : null,
  };
}

export async function getUserCredentials(userId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const creds = await prisma.encryptedProviderCredential.findMany({
        where: { userId },
        include: { provider: true },
      });
      return creds.map((c) => ({
        id: c.id,
        providerId: c.provider.slug,
        providerSlug: c.provider.slug,
        providerName: c.provider.name,
        keyMask: c.keyMask,
        isValid: c.isValid,
        lastTestedAt: c.lastTestedAt,
        lastError: c.lastError,
        createdAt: c.createdAt,
      }));
    } catch {
      // Fall through
    }
  }

  const list: any[] = [];
  for (const [key, cred] of inMemoryStore.credentials.entries()) {
    if (key.startsWith(`${userId}:`)) {
      list.push(cred);
    }
  }
  return list;
}

export async function getActiveApiKey(userId: string, providerSlug: string): Promise<string | null> {
  // Check user saved credentials
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const cred = await prisma.encryptedProviderCredential.findFirst({
        where: {
          userId,
          provider: { slug: providerSlug },
        },
      });

      if (cred) {
        return decryptApiKey({
          encryptedKey: cred.encryptedKey,
          iv: cred.iv,
          authTag: cred.authTag,
        });
      }
    } catch {
      // Fall through
    }
  }

  const memKey = `${userId}:${providerSlug}`;
  const memCred = inMemoryStore.credentials.get(memKey);
  if (memCred?.rawKey) {
    return memCred.rawKey;
  }

  // Fallback to server-level environment variable if provided
  const envMap: Record<string, string | undefined> = {
    google: process.env.GOOGLE_GEMINI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    cloudflare: process.env.CLOUDFLARE_API_KEY,
    huggingface: process.env.HUGGINGFACE_API_KEY,
  };

  return envMap[providerSlug] || null;
}

export async function saveUserCredential(
  userId: string,
  providerSlug: string,
  plainKey: string,
  extraConfig?: { accountId?: string }
) {
  const encrypted = encryptApiKey(plainKey);
  const keyMask = maskApiKey(plainKey);

  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      let provider = await prisma.provider.findUnique({
        where: { slug: providerSlug },
      });
      if (!provider) {
        const seedP = SEED_PROVIDERS.find((p) => p.slug === providerSlug);
        if (seedP) {
          provider = await prisma.provider.create({ data: seedP });
        }
      }

      if (provider) {
        const result = await prisma.encryptedProviderCredential.upsert({
          where: {
            userId_providerId: {
              userId,
              providerId: provider.id,
            },
          },
          create: {
            userId,
            providerId: provider.id,
            encryptedKey: encrypted.encryptedKey,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            keyMask,
            isValid: true,
            lastTestedAt: new Date(),
          },
          update: {
            encryptedKey: encrypted.encryptedKey,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            keyMask,
            isValid: true,
            lastTestedAt: new Date(),
            lastError: null,
          },
        });
        return { success: true, id: result.id, keyMask };
      }
    } catch {
      // Fall through to memory
    }
  }

  const providerSeed = SEED_PROVIDERS.find((p) => p.slug === providerSlug);
  const memCred = {
    id: `cred-${Date.now()}`,
    userId,
    providerId: providerSlug,
    providerSlug,
    providerName: providerSeed?.name || providerSlug,
    keyMask,
    rawKey: plainKey,
    extraConfig,
    isValid: true,
    lastTestedAt: new Date(),
    createdAt: new Date(),
  };

  inMemoryStore.credentials.set(`${userId}:${providerSlug}`, memCred);
  return { success: true, id: memCred.id, keyMask };
}

export async function deleteUserCredential(userId: string, providerSlug: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const provider = await prisma.provider.findUnique({
        where: { slug: providerSlug },
      });
      if (provider) {
        await prisma.encryptedProviderCredential.deleteMany({
          where: { userId, providerId: provider.id },
        });
        return true;
      }
    } catch {
      // Fall through
    }
  }

  inMemoryStore.credentials.delete(`${userId}:${providerSlug}`);
  return true;
}

export async function getConversations(userId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const convs = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      });
      return convs;
    } catch {
      // Fall through
    }
  }

  const userConvs: any[] = [];
  for (const [id, c] of inMemoryStore.conversations.entries()) {
    if (c.userId === userId) {
      userConvs.push(c);
    }
  }
  return userConvs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getConversationWithMessages(userId: string, conversationId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });
      if (conv) return conv;
    } catch {
      // Fall through
    }
  }

  const conv = inMemoryStore.conversations.get(conversationId);
  if (!conv || conv.userId !== userId) return null;
  const messages = inMemoryStore.messages.get(conversationId) || [];
  return { ...conv, messages };
}

export async function createConversation(
  userId: string,
  data: {
    title?: string;
    providerId: string;
    modelId: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const conv = await prisma.conversation.create({
        data: {
          userId,
          title: data.title || "New Conversation",
          providerId: data.providerId,
          modelId: data.modelId,
          systemPrompt: data.systemPrompt,
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 2048,
        },
      });
      return conv;
    } catch {
      // Fall through
    }
  }

  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const newConv = {
    id,
    userId,
    title: data.title || "New Conversation",
    providerId: data.providerId,
    modelId: data.modelId,
    systemPrompt: data.systemPrompt,
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens ?? 2048,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryStore.conversations.set(id, newConv);
  inMemoryStore.messages.set(id, []);
  return newConv;
}

export async function addMessageToConversation(
  conversationId: string,
  message: {
    role: string;
    content: string;
    tokenUsagePrompt?: number;
    tokenUsageCompletion?: number;
    latencyMs?: number;
    modelId?: string;
    error?: string;
  }
) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const created = await prisma.message.create({
        data: {
          conversationId,
          role: message.role,
          content: message.content,
          tokenUsagePrompt: message.tokenUsagePrompt,
          tokenUsageCompletion: message.tokenUsageCompletion,
          latencyMs: message.latencyMs,
          modelId: message.modelId,
          error: message.error,
        },
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return created;
    } catch {
      // Fall through
    }
  }

  const msg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    ...message,
    createdAt: new Date(),
  };

  const list = inMemoryStore.messages.get(conversationId) || [];
  list.push(msg);
  inMemoryStore.messages.set(conversationId, list);

  const conv = inMemoryStore.conversations.get(conversationId);
  if (conv) {
    conv.updatedAt = new Date();
  }

  return msg;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      await prisma.conversation.deleteMany({
        where: { id: conversationId, userId },
      });
      return true;
    } catch {
      // Fall through
    }
  }

  const conv = inMemoryStore.conversations.get(conversationId);
  if (conv && conv.userId === userId) {
    inMemoryStore.conversations.delete(conversationId);
    inMemoryStore.messages.delete(conversationId);
    return true;
  }
  return false;
}

export async function recordUsage(record: {
  userId: string;
  providerId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: string;
  errorMessage?: string;
}) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      await prisma.usageRecord.create({
        data: record,
      });
      return;
    } catch {
      // Fall through
    }
  }

  inMemoryStore.usageRecords.push({
    id: `usage-${Date.now()}`,
    ...record,
    createdAt: new Date(),
  });
}

export async function getUserUsageStats(userId: string) {
  const hasDb = await checkDbConnection();
  if (hasDb) {
    try {
      const records = await prisma.usageRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return records;
    } catch {
      // Fall through
    }
  }

  return inMemoryStore.usageRecords
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
