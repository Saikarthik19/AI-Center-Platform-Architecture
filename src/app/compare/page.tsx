"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitCompare,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Coins,
  ShieldCheck,
  KeyRound,
  X,
  Play,
} from "lucide-react";
import { formatNumber, formatPrice } from "@/lib/utils";

export default function ComparePage() {
  const [allModels, setAllModels] = useState<any[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([
    "gemini-1.5-flash",
    "llama-3.3-70b-versatile",
  ]);
  const [prompt, setPrompt] = useState("Compare the time complexity of QuickSort vs MergeSort in 3 bullet points.");
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<any[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.models) setAllModels(data.models);
      })
      .catch(() => {});
  }, []);

  const selectedModels = selectedSlugs
    .map((slug) => allModels.find((m) => m.slug === slug))
    .filter(Boolean);

  function addModelToCompare(slug: string) {
    if (selectedSlugs.includes(slug)) return;
    if (selectedSlugs.length >= 4) {
      alert("You can compare up to 4 models at once.");
      return;
    }
    setSelectedSlugs([...selectedSlugs, slug]);
  }

  function removeModelFromCompare(slug: string) {
    if (selectedSlugs.length <= 2) {
      alert("At least 2 models are required for comparison.");
      return;
    }
    setSelectedSlugs(selectedSlugs.filter((s) => s !== slug));
  }

  async function handleRunSideBySideTest() {
    if (!prompt.trim() || isRunningTest) return;

    setIsRunningTest(true);
    setErrorMessage(null);
    setBenchmarkResults(null);

    try {
      const res = await fetch("/api/compare/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelSlugs: selectedSlugs,
          prompt: prompt.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Benchmark run failed.");
      }

      setBenchmarkResults(data.results);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to execute side-by-side test.");
    } finally {
      setIsRunningTest(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          <GitCompare className="h-3.5 w-3.5 text-purple-400" />
          <span>Objective Side-by-Side Analysis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Model Comparison & Latency Benchmark
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Compare specifications side-by-side and execute the same prompt simultaneously across 2 to 4 models. Measures actual response latency and output quality directly from official providers without fabricated rankings.
        </p>
      </div>

      {/* Model Selector Bar */}
      <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-zinc-300">
            Selected Models ({selectedSlugs.length}/4):
          </span>

          {selectedSlugs.length < 4 && (
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addModelToCompare(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">+ Add Model to Compare</option>
                {allModels
                  .filter((m) => !selectedSlugs.includes(m.slug))
                  .map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name} ({m.provider?.name || m.providerSlug})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedModels.map((m) => (
            <div
              key={m.slug}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/30 text-xs font-medium text-purple-200"
            >
              <span>{m.name}</span>
              <span className="text-[10px] text-zinc-400 font-mono">({m.providerSlug})</span>
              <button
                onClick={() => removeModelFromCompare(m.slug)}
                className="hover:text-rose-400 transition-colors"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Specifications Comparison Table */}
      <div className="rounded-2xl border border-border/80 bg-zinc-900/50 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-zinc-950/80 border-b border-border/70 text-zinc-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-4 font-semibold w-48">Specification</th>
              {selectedModels.map((m) => (
                <th key={m.slug} className="p-4 font-bold text-white min-w-[200px]">
                  <div>{m.name}</div>
                  <span className="text-[10px] font-normal text-purple-400">{m.provider?.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-zinc-300">
            <tr>
              <td className="p-4 font-medium text-zinc-400">Context Window</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 font-mono font-bold text-white">
                  {formatNumber(m.contextWindow)} tokens
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Category</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 font-medium">
                  {m.category}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Free Tier Status</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      m.freeTierStatus === "RECURRING_FREE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {m.freeTierStatus.replace(/_/g, " ")}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Input Pricing (per 1M tokens)</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 font-mono text-zinc-200">
                  {formatPrice(m.inputPricingPerMillion)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Output Pricing (per 1M tokens)</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 font-mono text-zinc-200">
                  {formatPrice(m.outputPricingPerMillion)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Architecture</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4">
                  {m.isOpenWeight ? "Open Weights" : "Proprietary"}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">API Compatibility</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 font-mono text-zinc-300">
                  {m.apiCompatibility}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 font-medium text-zinc-400">Rate Limits</td>
              {selectedModels.map((m) => (
                <td key={m.slug} className="p-4 text-zinc-400 text-[11px] leading-relaxed">
                  {m.rateLimitInfo || "Standard tier limits"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Live Side-by-Side Prompt Execution Box */}
      <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-base font-bold text-white">Live Side-by-Side Execution Test</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Dispatch the exact same prompt to all {selectedModels.length} models concurrently and inspect latency, output length, and responses.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to test across models..."
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />

          <button
            onClick={handleRunSideBySideTest}
            disabled={isRunningTest || !prompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 inline-flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {isRunningTest ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Benchmarking...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Execute Benchmark</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Benchmark Results Side-by-Side Grid */}
        {benchmarkResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 pt-4 border-t border-border/60">
            {benchmarkResults.map((res) => (
              <div
                key={res.slug}
                className={`rounded-xl border p-4 space-y-3 ${
                  res.success
                    ? "border-purple-500/30 bg-zinc-950/80"
                    : "border-rose-500/30 bg-rose-950/10"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">{res.modelName}</h3>
                    <span className="text-[10px] text-purple-400">{res.providerName}</span>
                  </div>

                  {res.success ? (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                      <Clock className="h-3 w-3" /> {res.latencyMs}ms
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-semibold">Failed</span>
                  )}
                </div>

                {res.success ? (
                  <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {res.content}
                  </div>
                ) : (
                  <div className="text-xs text-rose-300">
                    <p>{res.error}</p>
                    <Link
                      href="/keys"
                      className="inline-flex items-center gap-1 text-purple-400 hover:underline mt-2 text-[11px]"
                    >
                      Connect provider key <KeyRound className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
