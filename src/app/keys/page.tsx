"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  RefreshCw,
  Lock,
  Zap,
  Info,
  Server,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ApiKeyCenterPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Connection form state
  const [selectedProvider, setSelectedProvider] = useState("google");
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [accountId, setAccountId] = useState(""); // For Cloudflare
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingStatus, setTestingStatus] = useState<any | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadData() {
    try {
      const [provRes, credRes] = await Promise.all([
        fetch("/api/providers").then((r) => r.json()),
        fetch("/api/keys").then((r) => r.json()),
      ]);

      if (provRes.providers) setProviders(provRes.providers);
      if (credRes.credentials) setCredentials(credRes.credentials);
    } catch (err) {
      console.error("Failed to load keys data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const currentProviderObj = providers.find((p) => p.slug === selectedProvider);

  async function handleTestKey() {
    if (!inputKey.trim()) {
      setMessage({ text: "Please enter an API key to test.", type: "error" });
      return;
    }

    setTestingStatus({ running: true, message: "Testing connection with provider endpoint..." });
    setMessage(null);

    try {
      const extraConfig: Record<string, string> = {};
      if (selectedProvider === "cloudflare" && accountId.trim()) {
        extraConfig.accountId = accountId.trim();
      }

      const res = await fetch("/api/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSlug: selectedProvider,
          apiKey: inputKey.trim(),
          extraConfig,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestingStatus({
          running: false,
          success: true,
          message: data.message,
          latencyMs: data.latencyMs,
        });
      } else {
        setTestingStatus({
          running: false,
          success: false,
          message: data.error || data.message || "Connection test failed.",
          suggestedAction: data.suggestedAction,
        });
      }
    } catch (err: any) {
      setTestingStatus({
        running: false,
        success: false,
        message: err.message || "Failed to reach backend test service.",
      });
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!inputKey.trim()) {
      setMessage({ text: "Please enter a valid API key.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const extraConfig: Record<string, string> = {};
      if (selectedProvider === "cloudflare" && accountId.trim()) {
        extraConfig.accountId = accountId.trim();
      }

      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerSlug: selectedProvider,
          apiKey: inputKey.trim(),
          extraConfig,
          validateFirst: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          text: `Successfully encrypted and connected key for ${currentProviderObj?.name || selectedProvider}!`,
          type: "success",
        });
        setInputKey("");
        setAccountId("");
        setTestingStatus(null);
        await loadData();
      } else {
        setMessage({
          text: data.error || data.details || "Failed to connect key.",
          type: "error",
        });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDisconnect(providerSlug: string) {
    if (!confirm(`Are you sure you want to disconnect and delete your key for ${providerSlug}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/keys?provider=${providerSlug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage({ text: `Key disconnected for ${providerSlug}.`, type: "success" });
        await loadData();
      }
    } catch (err: any) {
      setMessage({ text: "Failed to disconnect key", type: "error" });
    }
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          <span>Zero-Knowledge Key Storage</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          API Key Center
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Bring your own API keys. Keys are encrypted at rest using AES-256-GCM with a master key stored outside the database. They are never logged, never exposed to browser storage, and never transmitted to third parties except the direct provider endpoint.
        </p>
      </div>

      {/* Main Grid: Connect Form & Active Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Form (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-zinc-900/50 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Connect New Provider Key</h2>
            </div>
            {currentProviderObj && (
              <a
                href={currentProviderObj.keySignupUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
              >
                Get {currentProviderObj.name} Key <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <form onSubmit={handleSaveKey} className="space-y-4">
            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Select Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setTestingStatus(null);
                  setMessage(null);
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {providers.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} {p.isConnected ? "(Connected)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Provider Instructions Alert */}
            {currentProviderObj && (
              <div className="rounded-xl border border-border/60 bg-zinc-950/70 p-3.5 space-y-1 text-xs">
                <span className="font-semibold text-zinc-300">Setup Instructions:</span>
                <p className="text-zinc-400 leading-relaxed">
                  Sign in to{" "}
                  <a
                    href={currentProviderObj.keySignupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline font-medium"
                  >
                    {currentProviderObj.name} Console
                  </a>
                  , create an API key, copy it, and paste it below. Free tiers apply automatically.
                </p>
              </div>
            )}

            {/* Cloudflare Account ID Extra Field */}
            {selectedProvider === "cloudflare" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Cloudflare Account ID <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="e.g. 9b72a6a123f044bb8354c..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
              </div>
            )}

            {/* API Key Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                API Key (Confidential)
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder={`Paste your ${currentProviderObj?.name || ""} API key...`}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Test Status Indicator */}
            {testingStatus && (
              <div
                className={`rounded-xl p-3 text-xs border ${
                  testingStatus.running
                    ? "bg-zinc-800 text-zinc-300 border-zinc-700 animate-pulse"
                    : testingStatus.success
                    ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/30 text-rose-300 border-rose-500/30"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {testingStatus.running ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  ) : testingStatus.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>{testingStatus.message}</span>
                </div>
                {testingStatus.latencyMs && (
                  <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                    Observed connection latency: {testingStatus.latencyMs}ms
                  </p>
                )}
                {testingStatus.suggestedAction && (
                  <p className="text-[11px] text-zinc-300 mt-1 font-medium">
                    Tip: {testingStatus.suggestedAction}
                  </p>
                )}
              </div>
            )}

            {/* Message alert */}
            {message && (
              <div
                className={`rounded-xl p-3 text-xs border ${
                  message.type === "success"
                    ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-950/30 text-rose-300 border-rose-500/30"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testingStatus?.running}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
              >
                {testingStatus?.running ? "Validating..." : "Test Connection"}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Encrypting & Saving..." : "Encrypt & Connect"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Connected Keys List (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border/80 bg-zinc-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <h2 className="text-base font-bold text-white">Active Keys ({credentials.length})</h2>
            <button
              onClick={loadData}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              title="Refresh credentials"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {credentials.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <KeyRound className="h-10 w-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                No custom keys connected yet. Connect an API key using the form to unlock playground chat and comparison.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="rounded-xl border border-border/60 bg-zinc-950/70 p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{cred.providerName}</h4>
                      <span className="font-mono text-xs text-purple-300">{cred.keyMask}</span>
                    </div>

                    <button
                      onClick={() => handleDisconnect(cred.providerSlug || cred.providerId)}
                      className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Disconnect and delete key"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-border/40">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Validated
                    </span>
                    <span>Saved: {formatDate(cred.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Security Guarantee Box */}
          <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3.5 text-xs text-purple-300/90 space-y-1.5 mt-4">
            <div className="flex items-center gap-1.5 font-semibold text-purple-200">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Security Guarantee</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Your keys are never stored unencrypted. When deleted, encrypted records and IVs are permanently erased from the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
