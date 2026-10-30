"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Sparkles,
  BookOpen,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  async function loadProviders() {
    try {
      const res = await fetch("/api/providers");
      const data = await res.json();
      if (data.providers) setProviders(data.providers);
    } catch (err) {
      console.error("Failed to load providers", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function handleQuickTest(slug: string) {
    setTestingSlug(slug);
    try {
      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerSlug: slug }),
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [slug]: {
          success: res.ok && data.success,
          message: data.message || data.error || "Connection test completed.",
          latencyMs: data.latencyMs,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [slug]: {
          success: false,
          message: err.message || "Failed to reach backend test service.",
        },
      }));
    } finally {
      setTestingSlug(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
          <Server className="h-3.5 w-3.5 text-blue-400" />
          <span>Extensible Provider Adapters</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Supported AI Providers
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          AI Center connects directly to official provider APIs using modular adapters. Each adapter handles authentication, streaming SSE, parameter translation, and error normalization.
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {providers.map((p) => {
          const isConn = p.isConnected || p.hasServerKey;
          const testRes = testResults[p.slug];

          return (
            <div
              key={p.slug}
              className="rounded-2xl border border-border/80 bg-zinc-900/40 p-6 space-y-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600/30 to-blue-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-white">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{p.name}</h3>
                      <span className="text-xs text-zinc-500 font-mono">
                        {p._count?.models || 0} models cataloged
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      isConn
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50"
                    }`}
                  >
                    {isConn ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-zinc-500" />
                        Key Required
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {p.description}
                </p>

                {/* Free Tier Info */}
                <div className="rounded-xl border border-border/60 bg-zinc-950/60 p-3 text-xs space-y-1">
                  <span className="font-semibold text-zinc-200 block">Verified Access & Pricing:</span>
                  <p className="text-zinc-400 leading-relaxed">{p.freeTierSummary}</p>
                </div>

                {/* Test Result Indicator */}
                {testRes && (
                  <div
                    className={`rounded-xl p-3 text-xs border ${
                      testRes.success
                        ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-950/30 text-rose-300 border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {testRes.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span>{testRes.message}</span>
                    </div>
                    {testRes.latencyMs && (
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Connection latency: {testRes.latencyMs}ms
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons & Links */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={p.officialWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
                  >
                    Website <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href={p.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
                  >
                    API Reference <BookOpen className="h-3 w-3" />
                  </a>

                  <a
                    href={p.keySignupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-medium"
                  >
                    Get API Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickTest(p.slug)}
                    disabled={testingSlug === p.slug}
                    className="flex-1 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${testingSlug === p.slug ? "animate-spin text-purple-400" : ""}`}
                    />
                    <span>{testingSlug === p.slug ? "Testing..." : "Test Connection"}</span>
                  </button>

                  <Link
                    href={`/keys?provider=${p.slug}`}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>{isConn ? "Manage Key" : "Connect Key"}</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
