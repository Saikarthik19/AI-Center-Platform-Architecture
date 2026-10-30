"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Moon,
  Sun,
  ShieldCheck,
  KeyRound,
  User,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  collapsed: boolean;
}

export function Header({ onMobileMenuToggle, collapsed }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check connected providers
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        if (data.providers) {
          const count = data.providers.filter((p: any) => p.isConnected || p.hasServerKey).length;
          setConnectedCount(count);
        }
      })
      .catch(() => {});

    // Check user session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/models?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/80 bg-[#0a0a0e]/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg border border-border/60 hover:bg-zinc-800 text-zinc-400 hover:text-white"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 35+ models, capabilities, providers..."
            className="w-72 lg:w-96 pl-9 pr-4 py-1.5 text-xs rounded-full border border-border/80 bg-zinc-900/70 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status pill */}
        <Link
          href="/keys"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-zinc-900/60 hover:border-purple-500/40 hover:bg-zinc-800/60 text-xs font-medium text-zinc-300 transition-colors"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connectedCount > 0 ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="hidden sm:inline">Providers:</span>
          <span className="text-purple-400 font-semibold">{connectedCount}/6</span>
          <KeyRound className="h-3 w-3 text-zinc-400" />
        </Link>

        {/* Quick Launch Playground */}
        <Link
          href="/playground"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-500/10 transition-all"
        >
          <Sparkles className="h-3 w-3" />
          <span>Playground</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          title={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Profile / Status */}
        <Link
          href={user?.isGuest ? "/login" : "/settings"}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-border/60 bg-zinc-900/60 hover:bg-zinc-800/80 text-xs text-zinc-300 transition-colors"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-white font-bold text-[10px]">
            {user?.name ? user.name[0].toUpperCase() : <User className="h-3 w-3" />}
          </div>
          <span className="hidden md:inline truncate max-w-[100px]">
            {user?.name || "Developer"}
          </span>
        </Link>
      </div>
    </header>
  );
}
