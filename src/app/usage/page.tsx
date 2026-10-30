"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Clock,
  Zap,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function UsagePage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUsage() {
    setLoading(true);
    try {
      const res = await fetch("/api/usage");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load usage", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsage();
  }, []);

  const summary = data?.summary || {
    totalRequests: 0,
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    avgLatencyMs: 0,
    byProvider: {},
  };

  const records = data?.records || [];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
            <span>Telemetry & Quotas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Usage & Limits
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Live telemetry of prompts, completions, tokens generated, and measured latency across all connected model providers.
          </p>
        </div>

        <button
          onClick={loadUsage}
          className="p-2 rounded-xl border border-border bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-400" : ""}`} />
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-400">Total API Requests</span>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {summary.totalRequests}
          </div>
          <p className="text-[11px] text-zinc-500">Playground & side-by-side tests</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-400">Total Tokens Processed</span>
          <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-mono">
            {formatNumber(summary.totalTokens)}
          </div>
          <p className="text-[11px] text-zinc-500">
            {formatNumber(summary.totalPromptTokens)} prompt / {formatNumber(summary.totalCompletionTokens)} completion
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-400">Average Response Latency</span>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
            {summary.avgLatencyMs}ms
          </div>
          <p className="text-[11px] text-zinc-500">Measured from real requests</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-1">
          <span className="text-xs font-medium text-zinc-400">Active Providers</span>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {Object.keys(summary.byProvider).length}
          </div>
          <p className="text-[11px] text-zinc-500">Used in recent traffic</p>
        </div>
      </div>

      {/* Provider Distribution */}
      {Object.keys(summary.byProvider).length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">Token Distribution by Provider</h2>
          <div className="space-y-3">
            {Object.entries(summary.byProvider).map(([provider, count]: [string, any]) => {
              const pct = summary.totalTokens > 0 ? Math.round((count / summary.totalTokens) * 100) : 0;
              return (
                <div key={provider} className="space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="capitalize font-semibold">{provider}</span>
                    <span className="font-mono text-zinc-400">
                      {formatNumber(count)} tokens ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Request Telemetry Log */}
      <div className="rounded-2xl border border-border/80 bg-zinc-900/40 p-5 space-y-4">
        <h2 className="text-sm font-bold text-white">Recent Execution Records</h2>

        {records.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Cpu className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">No requests recorded yet.</p>
            <p className="text-[11px] text-zinc-500">
              Run requests in the Playground or Model Comparison to see live telemetry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950/60 border-b border-border/70 text-zinc-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Tokens (Prompt / Comp)</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-zinc-300">
                {records.slice(0, 15).map((r: any) => (
                  <tr key={r.id}>
                    <td className="p-3 text-zinc-500 font-mono text-[11px]">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="p-3 font-semibold text-purple-400 uppercase">
                      {r.providerId}
                    </td>
                    <td className="p-3 font-mono text-zinc-200">{r.modelId}</td>
                    <td className="p-3 font-mono">
                      {r.promptTokens} / {r.completionTokens} ({r.totalTokens})
                    </td>
                    <td className="p-3 font-mono text-emerald-400">{r.latencyMs}ms</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === "success"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
