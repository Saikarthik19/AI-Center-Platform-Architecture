"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  ShieldCheck,
  Lock,
  LogOut,
  User,
  KeyRound,
  CheckCircle2,
  Trash2,
  Database,
  Terminal,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          <Settings className="h-3.5 w-3.5 text-purple-400" />
          <span>Platform Preferences</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings & Security Architecture
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Manage your account session, review cryptographic protections, and verify zero-trust API credential isolation.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{user?.name || "Developer"}</h2>
              <span className="text-xs text-zinc-400 font-mono">{user?.email || "developer@aicenter.dev"}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-border bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-border/60 bg-zinc-950/60 space-y-1">
            <span className="text-zinc-500 block text-[10px]">Session Status</span>
            <span className="font-semibold text-emerald-400 inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Active (HTTP-only JWT Cookie)
            </span>
          </div>

          <div className="p-3 rounded-xl border border-border/60 bg-zinc-950/60 space-y-1">
            <span className="text-zinc-500 block text-[10px]">Role & Access</span>
            <span className="font-semibold text-zinc-200">
              {user?.role || "USER"} (Full Catalog & Playground Access)
            </span>
          </div>
        </div>
      </div>

      {/* Security Architecture Audit Box */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-bold text-white">Security Architecture Audit</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-zinc-950/70">
            <Lock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">AES-256-GCM Encryption at Rest:</span>
              <p className="text-zinc-400 leading-relaxed text-[11px] mt-0.5">
                Every user API key is encrypted using AES-256-GCM with a distinct random 96-bit initialization vector (IV) and 128-bit authentication tag. Plaintext keys never touch the database.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-zinc-950/70">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">Strict SSRF Protection & Allowlist:</span>
              <p className="text-zinc-400 leading-relaxed text-[11px] mt-0.5">
                All outbound provider requests are strictly validated against a hardcoded domain allowlist. Private IP ranges (127.0.0.1, 10.x, 192.168.x, 169.254.x) are blocked before any fetch is initiated.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-zinc-950/70">
            <Terminal className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-zinc-200 block">Secret Redaction Filter:</span>
              <p className="text-zinc-400 leading-relaxed text-[11px] mt-0.5">
                All server error strings, provider responses, and logs pass through a regex redaction pipeline that strips API key patterns (Google, Groq, OpenRouter, Mistral, HuggingFace, Bearer tokens).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
