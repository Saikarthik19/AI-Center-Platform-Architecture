"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  Cpu,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  ArrowUpDown,
  X,
  Code2,
  Eye,
  Zap,
} from "lucide-react";
import { formatNumber, formatPrice, formatDate } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "CHAT", label: "General Chat" },
  { id: "REASONING", label: "Reasoning" },
  { id: "CODING", label: "Coding" },
  { id: "MULTIMODAL", label: "Multimodal & Vision" },
  { id: "IMAGE", label: "Image Generation" },
  { id: "AUDIO", label: "Audio & Speech" },
  { id: "EMBEDDING", label: "Embeddings" },
  { id: "RERANKING", label: "Reranking" },
];

const PROVIDERS = [
  { id: "all", label: "All Providers" },
  { id: "google", label: "Google Gemini" },
  { id: "groq", label: "Groq" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "mistral", label: "Mistral AI" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "huggingface", label: "Hugging Face" },
];

function DiscoverModelsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialProvider = searchParams.get("provider") || "all";

  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [selectedFreeStatus, setSelectedFreeStatus] = useState("all");
  const [openWeightOnly, setOpenWeightOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [selectedModel, setSelectedModel] = useState<any | null>(null);

  useEffect(() => {
    async function loadModels() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedProvider !== "all") query.set("provider", selectedProvider);
        if (selectedCategory !== "all") query.set("category", selectedCategory);
        if (selectedFreeStatus !== "all") query.set("freeTierStatus", selectedFreeStatus);
        if (search.trim()) query.set("search", search.trim());
        if (sortBy) query.set("sort", sortBy);

        const res = await fetch(`/api/models?${query.toString()}`);
        const data = await res.json();
        if (data.models) setModels(data.models);
      } catch (err) {
        console.error("Failed to load models", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadModels, 150);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedProvider, selectedFreeStatus, sortBy]);

  const filteredModels = useMemo(() => {
    if (!openWeightOnly) return models;
    return models.filter((m) => m.isOpenWeight);
  }, [models, openWeightOnly]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Discover AI Models
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Explore verified models across providers. Compare context lengths, capabilities, modalities, and real pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/free-models"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/30 transition-colors"
          >
            <span>Verified Free Models Only</span>
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 text-purple-300 text-xs font-semibold hover:bg-purple-900/30 transition-colors"
          >
            <span>Compare Models</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-border/80 bg-zinc-900/50 p-4 space-y-4">
        {/* Search & Main Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model name, slug..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedFreeStatus}
              onChange={(e) => setSelectedFreeStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Access Tiers</option>
              <option value="RECURRING_FREE">Recurring Free Tier</option>
              <option value="LIMITED_QUOTA">Limited Free Quota</option>
              <option value="TRIAL_CREDITS">Trial Credits</option>
              <option value="FREE_WITH_PAYMENT_METHOD">Free (With Card/Account)</option>
              <option value="PAID">Paid / Commercial</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="name">Sort by Name</option>
              <option value="context">Sort by Context Window (Largest)</option>
              <option value="price-low">Sort by Price (Lowest First)</option>
              <option value="price-high">Sort by Price (Highest First)</option>
            </select>
          </div>
        </div>

        {/* Category Pills & Open-Weight toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-purple-600 text-white font-semibold"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={openWeightOnly}
              onChange={(e) => setOpenWeightOnly(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-purple-600 focus:ring-purple-500"
            />
            <span>Open Weights Only</span>
          </label>
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl border border-border/60 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border/70 p-8 space-y-3">
          <Cpu className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-semibold text-zinc-200">No matching models found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or switching to &quot;All Providers&quot;.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
              setSelectedProvider("all");
              setSelectedFreeStatus("all");
              setOpenWeightOnly(false);
            }}
            className="text-xs font-medium text-purple-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.slug}
              className="rounded-xl border border-border/70 bg-zinc-900/40 p-4 hover:border-purple-500/40 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 tracking-wider uppercase">
                      {model.provider?.name || model.providerSlug}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                      {model.name}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      model.freeTierStatus === "RECURRING_FREE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : model.freeTierStatus === "TRIAL_CREDITS"
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700/40"
                    }`}
                  >
                    {model.freeTierStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                  {model.description}
                </p>

                {/* Badges / Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                  <div className="bg-zinc-800/40 rounded p-1.5 border border-zinc-700/30">
                    <span className="text-zinc-500 block text-[10px]">Context Window</span>
                    <span className="font-mono font-medium text-zinc-200">
                      {formatNumber(model.contextWindow)} tokens
                    </span>
                  </div>

                  <div className="bg-zinc-800/40 rounded p-1.5 border border-zinc-700/30">
                    <span className="text-zinc-500 block text-[10px]">Category</span>
                    <span className="font-medium text-zinc-200">{model.category}</span>
                  </div>

                  <div className="bg-zinc-800/40 rounded p-1.5 border border-zinc-700/30">
                    <span className="text-zinc-500 block text-[10px]">Input Pricing</span>
                    <span className="font-mono font-medium text-zinc-200">
                      {formatPrice(model.inputPricingPerMillion)}
                    </span>
                  </div>

                  <div className="bg-zinc-800/40 rounded p-1.5 border border-zinc-700/30">
                    <span className="text-zinc-500 block text-[10px]">Output Pricing</span>
                    <span className="font-mono font-medium text-zinc-200">
                      {formatPrice(model.outputPricingPerMillion)}
                    </span>
                  </div>
                </div>

                {/* Capabilities list */}
                {model.supportedCapabilities && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {model.supportedCapabilities.slice(0, 3).map((cap: string) => (
                      <span
                        key={cap}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-400 border border-zinc-700/40"
                      >
                        {cap}
                      </span>
                    ))}
                    {model.supportedCapabilities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-500">
                        +{model.supportedCapabilities.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                <button
                  onClick={() => setSelectedModel(model)}
                  className="flex-1 py-1.5 rounded-lg border border-border bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
                >
                  Inspect Specs
                </button>

                <Link
                  href={`/playground?model=${model.slug}&provider=${model.providerSlug || model.provider?.slug}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Playground</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-[#0d0d12] p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedModel(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg border border-border/60 hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                  {selectedModel.provider?.name || selectedModel.providerSlug}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  • {selectedModel.slug}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{selectedModel.name}</h2>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {selectedModel.description}
              </p>
            </div>

            {/* Specs Table */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">Context Window</span>
                <span className="text-sm font-bold text-white font-mono">
                  {formatNumber(selectedModel.contextWindow)} tokens
                </span>
              </div>

              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">Access Tier</span>
                <span className="text-sm font-bold text-emerald-400">
                  {selectedModel.freeTierStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">Open Weights</span>
                <span className="text-sm font-bold text-zinc-200">
                  {selectedModel.isOpenWeight ? "Yes (Open)" : "Proprietary"}
                </span>
              </div>

              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">Input Pricing</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {formatPrice(selectedModel.inputPricingPerMillion)}
                </span>
              </div>

              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">Output Pricing</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {formatPrice(selectedModel.outputPricingPerMillion)}
                </span>
              </div>

              <div className="bg-zinc-900/60 border border-border/60 rounded-xl p-3">
                <span className="text-[11px] text-zinc-500 block">API Compatibility</span>
                <span className="text-sm font-bold text-zinc-200 font-mono">
                  {selectedModel.apiCompatibility}
                </span>
              </div>
            </div>

            {/* Rate Limits & Verification Notice */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <h4 className="text-xs font-bold text-purple-200">Verified Rate Limits & Quotas</h4>
              </div>
              <p className="text-xs text-zinc-300">
                {selectedModel.rateLimitInfo || "Standard provider tier limits apply."}
              </p>
              <div className="text-[11px] text-zinc-500 pt-1">
                Last verified: {formatDate(selectedModel.lastVerifiedAt)} • Data source: Official provider documentation
              </div>
            </div>

            {/* Official Links */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-3">
                <a
                  href={selectedModel.officialDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-medium"
                >
                  Official Documentation <ExternalLink className="h-3 w-3" />
                </a>

                <a
                  href={selectedModel.officialKeyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1"
                >
                  Get API Key <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <Link
                href={`/playground?model=${selectedModel.slug}&provider=${selectedModel.providerSlug || selectedModel.provider?.slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Test in Playground</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DiscoverModelsPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-900/30 animate-pulse" />}>
      <DiscoverModelsContent />
    </Suspense>
  );
}
