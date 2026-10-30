"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Sparkles,
  Server,
  KeyRound,
  GitCompare,
  BookOpen,
  BarChart3,
  Settings,
  Gift,
  ChevronLeft,
  ChevronRight,
  Bot,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Discover Models", href: "/models", icon: Cpu },
    { name: "Free AI Models", href: "/free-models", icon: Gift, badge: "Verified" },
    { name: "AI Playground", href: "/playground", icon: Sparkles },
    { name: "Providers", href: "/providers", icon: Server },
    { name: "API Key Center", href: "/keys", icon: KeyRound },
    { name: "Model Comparison", href: "/compare", icon: GitCompare },
    { name: "API Documentation", href: "/docs", icon: BookOpen },
    { name: "Usage & Limits", href: "/usage", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-border bg-[#0d0d12] transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-white via-zinc-200 to-purple-300 bg-clip-text text-transparent">
                  AI Center
                </span>
                <span className="text-[10px] block font-mono text-zinc-500 uppercase tracking-widest -mt-1">
                  Unified Hub
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="mx-auto">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
            </Link>
          )}

          <button
            onClick={onToggle}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-purple-600/15 text-purple-300 border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-zinc-200"
                  )}
                />
                {!collapsed && (
                  <span className="truncate flex-1">{item.name}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Provider Quick Link Banner */}
        {!collapsed && (
          <div className="p-3 m-2.5 rounded-xl border border-purple-500/20 bg-purple-950/20">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-200">Bring Your Own Key</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-2">
              Keys are encrypted locally with AES-256-GCM.
            </p>
            <Link
              href="/keys"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300"
            >
              Open Key Center <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
