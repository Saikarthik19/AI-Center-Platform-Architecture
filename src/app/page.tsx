"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cpu,
  Server,
  KeyRound,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Gift,
  ExternalLink,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from "lucide-react";
import { formatNumber, formatPrice } from "@/lib/utils";

export default function OverviewPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [provRes, modRes, convRes] = await Promise.all([
          fetch("/api/providers").then((r) => r.json()),
          fetch("/api/models").then((r) => r.json()),
          fetch("/api/conversations").then((r) => r.json()),
        ]);

        if (provRes.providers) setProviders(provRes.providers);
        if (modRes.models) setModels(modRes.models);
        if (convRes.conversations) setConversations(convRes.conversations);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalModels = models.length;
  const totalProviders = providers.length;
  const connectedProviders = providers.filter((p) => p.isConnected || p.hasServerKey);
  const freeModels = models.filter((m) => m.freeTierStatus === "RECURRING_FREE");

  return (
    <div className="space-y-8">
      {/* Hero / Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-zinc-950 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Developer AI Hub & Playground</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-purple-200 bg-clip-text text-transparent">
            Welcome to AI Center
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Discover frontier foundation models, explore official API providers, connect your own keys with AES-256-GCM encryption, and benchmark performance across providers from one unified dashboard.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Playground</span>
            </Link>

            <Link
              href="/keys"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800 hover:border-purple-500/40 transition-all"
            >
              <KeyRound className="h-4 w-4 text-purple-400" />
              <span>Connect Provider Keys</span>
            </Link>

            <Link
              href="/free-models"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-300 hover:bg-emerald-900/30 transition-all"
            >
              <Gift className="h-4 w-4 text-emerald-400" />
              <span>Explore Free Tiers</span>
            </Link>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Models in Catalog</span>
            <Cpu className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : totalModels}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Across 8 categories</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Supported Providers</span>
            <Server className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : totalProviders}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Direct official adapters</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Connected Providers</span>
            <KeyRound className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {loading ? "..." : `${connectedProviders.length}/${totalProviders}`}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {connectedProviders.length > 0 ? "Ready for chat & testing" : "No keys connected yet"}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-zinc-900/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium">Recurring Free Models</span>
            <Gift className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
            {loading ? "..." : freeModels.length}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Zero token cost verified</p>
        </div>
      </div>

      {/* Provider Status Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Provider Connection Status</h2>
            <p className="text-xs text-zinc-400">
              Live status based on your authenticated AES-encrypted credentials or server keys.
            </p>
          </div>
          <Link
            href="/providers"
            className="text-xs font-medium text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
          >
            All Providers <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {providers.map((p) => {
            const isConn = p.isConnected || p.hasServerKey;
            return (
              <div
                key={p.slug}
                className="rounded-xl border border-border/70 bg-zinc-900/30 p-4 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-purple-400">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {p._count?.models || 0} models
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      isConn
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-800/60 text-zinc-400 border-zinc-700/40"
                    }`}
                  >
                    {isConn ? (
                      <>
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-2.5 w-2.5 text-zinc-500" />
                        Not Connected
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                  {p.freeTierSummary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                  <a
                    href={p.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
                  >
                    Docs <ExternalLink className="h-2.5 w-2.5" />
                  </a>

                  {isConn ? (
                    <Link
                      href={`/playground?provider=${p.slug}`}
                      className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                    >
                      Chat in Playground <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/keys?provider=${p.slug}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      Connect Key <KeyRound className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Models & Recent Conversations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Frontier Models (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Popular AI Models</h2>
              <p className="text-xs text-zinc-400">
                Top verified foundation models available for developer inference.
              </p>
            </div>
            <Link
              href="/models"
              className="text-xs font-medium text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
            >
              Browse All ({totalModels}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {models.slice(0, 4).map((m) => (
              <div
                key={m.slug}
                className="rounded-xl border border-border/70 bg-zinc-900/30 p-4 hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                      {m.provider?.name || m.providerSlug}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {m.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{m.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                    {m.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Context Window:</span>
                    <span className="font-mono text-zinc-300">
                      {formatNumber(m.contextWindow)} tokens
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>Pricing (In / Out):</span>
                    <span className="font-mono text-zinc-300">
                      {m.inputPricingPerMillion != null ? `$${m.inputPricingPerMillion}` : "Free"} /{" "}
                      {m.outputPricingPerMillion != null ? `$${m.outputPricingPerMillion}` : "Free"}
                    </span>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/playground?model=${m.slug}&provider=${m.providerSlug || m.provider?.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-purple-600/20 hover:text-purple-300 text-zinc-300 text-xs font-medium transition-all"
                    >
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>Test in Playground</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Conversations / Activity (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Recent Conversations</h2>
            <Link
              href="/playground"
              className="text-xs font-medium text-purple-400 hover:text-purple-300"
            >
              New Chat +
            </Link>
          </div>

          <div className="rounded-xl border border-border/70 bg-zinc-900/30 p-4 space-y-3">
            {conversations.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">No conversations yet.</p>
                <Link
                  href="/playground"
                  className="inline-block text-xs font-medium text-purple-400 hover:underline"
                >
                  Start your first conversation
                </Link>
              </div>
            ) : (
              conversations.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/playground?id=${c.id}`}
                  className="block p-2.5 rounded-lg border border-border/40 bg-zinc-900/60 hover:border-purple-500/40 hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-zinc-200 truncate max-w-[170px]">
                      {c.title || "Conversation"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                    <span className="text-purple-400">{c.modelId}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
