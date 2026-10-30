"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    setEmail("developer@aicenter.dev");
    setPassword("developer123");
    // Trigger submit
    setTimeout(() => {
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "developer@aicenter.dev",
          password: "developer123",
        }),
      })
        .then((r) => r.json())
        .then(() => {
          router.push("/");
          router.refresh();
        });
    }, 100);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {isRegister ? "Create Developer Account" : "Sign in to AI Center"}
          </h1>
          <p className="text-xs text-zinc-400">
            Unified directory, key vault, and playground for modern AI models.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ada Lovelace"
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-border bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="pt-2 border-t border-border/50 text-center space-y-2">
            <span className="text-[11px] text-zinc-500">Quick Test / Development Mode</span>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Instant Developer Demo Session</span>
            </button>
          </div>

          {/* Toggle Register / Login */}
          <div className="text-center text-xs text-zinc-400 pt-1">
            {isRegister ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-purple-400 hover:underline font-semibold"
                >
                  Register
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
