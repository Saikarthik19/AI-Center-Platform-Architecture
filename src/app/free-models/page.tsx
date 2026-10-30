"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gift,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

export default function FreeModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<string>("ALL_FREE");

  useEffect(() => {
    async function loadFreeModels() {
      try {
        const res = await fetch("/api/models");
        const data = await res.json();
        if (data.models) {
          // Filter to models with free tiers
          const freeList = data.models.filter(
            (m: any) =>
              m.freeTierStatus === "RECURRING_FREE" ||
              m.freeTierStatus === "LIMITED_QUOTA" ||
              m.freeTierStatus === "TRIAL_CREDITS" ||
              m.freeTierStatus === "FREE_WITH_PAYMENT_METHOD"
          );
          setModels(freeList);
        }
      } catch (err) {
        console.error("Failed to load free models", err);
      } finally {
        setLoading(false);
      }
    }
    loadFreeModels();
  }, []);

  const filtered = activeTier === "ALL_FREE"
    ? models
    : models.filter((m) => m.freeTierStatus === activeTier);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <Gift className="h-3.5 w-3.5 text-emerald-400" />
            <span>Verified Free-Tier Directory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Free AI Model Discovery
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every model below has verified developer access that does not require paying per token upfront. We strictly categorize recurring free tiers, limited community quotas, trial credit grants, and edge quotas.
          </p>
        </div>
      </div>

      {/* Verification Notice Alert */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-amber-300">Verification & Transparency Policy:</span>
          <p className="text-zinc-400">
            No API is listed as &quot;unlimited&quot; or &quot;permanently free&quot;. All free tiers are subject to provider rate limits (RPM/TPM) and may change according to provider terms of service. Free tiers on Google Gemini AI Studio or OpenRouter :free may log prompts for model improvement unless an enterprise agreement is signed.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: "ALL_FREE", label: "All Free Access Options", count: models.length },
          {
            id: "RECURRING_FREE",
            label: "Recurring Free Tier",
            count: models.filter((m) => m.freeTierStatus === "RECURRING_FREE").length,
          },
          {
            id: "LIMITED_QUOTA",
            label: "Community Quota",
            count: models.filter((m) => m.freeTierStatus === "LIMITED_QUOTA").length,
          },
          {
            id: "TRIAL_CREDITS",
            label: "Trial Credits",
            count: models.filter((m) => m.freeTierStatus === "TRIAL_CREDITS").length,
          },
          {
            id: "FREE_WITH_PAYMENT_METHOD",
            label: "Free with Account/Card",
            count: models.filter((m) => m.freeTierStatus === "FREE_WITH_PAYMENT_METHOD").length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTier(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTier === tab.id
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/15"
                : "bg-zinc-900 border border-border text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Grid of Free Models */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-60 rounded-xl border border-border/60 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((model) => (
            <div
              key={model.slug}
              className="rounded-xl border border-border/80 bg-zinc-900/40 p-5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      {model.provider?.name || model.providerSlug}
                    </span>
                    <h3 className="text-base font-bold text-white">{model.name}</h3>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    {model.freeTierStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  {model.description}
                </p>

                {/* Verified Limits Box */}
                <div className="rounded-lg border border-border/60 bg-zinc-950/60 p-3 mb-3 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified Quota / Rate Limits:</span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-400 pl-5">
                    {model.rateLimitInfo || "Standard free developer limits apply"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span>Context: {formatNumber(model.contextWindow)} tokens</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-zinc-500" />
                    <span>Open weights: {model.isOpenWeight ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <a
                    href={model.officialDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                  >
                    Documentation <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href={model.officialKeyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 hover:text-white inline-flex items-center gap-1"
                  >
                    Get Free Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <Link
                  href={`/playground?model=${model.slug}&provider=${model.providerSlug || model.provider?.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Try Model</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
