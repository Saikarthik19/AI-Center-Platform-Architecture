"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Square,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Plus,
  Sliders,
  Settings2,
  Bot,
  User,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  KeyRound,
  Zap,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface ChatMessageItem {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokenUsagePrompt?: number;
  tokenUsageCompletion?: number;
  latencyMs?: number;
  error?: string;
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const initialModel = searchParams.get("model") || "gemini-1.5-flash";
  const initialProvider = searchParams.get("provider") || "google";
  const conversationIdParam = searchParams.get("id");

  // Models and Providers lists
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(conversationIdParam);

  // Playground Settings
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showSettings, setShowSettings] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeError, setActiveError] = useState<{ message: string; suggestedAction?: string } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load models, providers, and conversations
  useEffect(() => {
    async function init() {
      try {
        const [provRes, modRes, convRes] = await Promise.all([
          fetch("/api/providers").then((r) => r.json()),
          fetch("/api/models").then((r) => r.json()),
          fetch("/api/conversations").then((r) => r.json()),
        ]);

        if (provRes.providers) setProviders(provRes.providers);
        if (modRes.models) {
          setModels(modRes.models);
          // Sync provider if model is set
          const matched = modRes.models.find((m: any) => m.slug === selectedModel);
          if (matched && matched.providerSlug) {
            setSelectedProvider(matched.providerSlug);
          }
        }
        if (convRes.conversations) setConversations(convRes.conversations);
      } catch (err) {
        console.error("Init failed", err);
      }
    }
    init();
  }, [selectedModel]);

  // Load conversation messages when currentConversationId changes
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    async function loadConv() {
      try {
        const res = await fetch(`/api/conversations/${currentConversationId}`);
        const data = await res.json();
        if (data.conversation) {
          setSelectedModel(data.conversation.modelId || selectedModel);
          setSelectedProvider(data.conversation.providerId || selectedProvider);
          if (data.conversation.systemPrompt) setSystemPrompt(data.conversation.systemPrompt);
          if (data.conversation.messages) {
            setMessages(
              data.conversation.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                latencyMs: m.latencyMs,
                tokenUsageCompletion: m.tokenUsageCompletion,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load conversation", err);
      }
    }
    loadConv();
  }, [currentConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Filter models for selected provider
  const availableModelsForProvider = models.filter(
    (m) => (m.providerSlug || m.provider?.slug) === selectedProvider
  );

  async function startNewConversation() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Conversation",
          providerId: selectedProvider,
          modelId: selectedModel,
          systemPrompt,
          temperature,
          maxTokens,
        }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations([data.conversation, ...conversations]);
        setCurrentConversationId(data.conversation.id);
        setMessages([]);
      }
    } catch {
      setMessages([]);
      setCurrentConversationId(null);
    }
  }

  async function handleDeleteConversation(id: string) {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations(conversations.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  async function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputText.trim() || isGenerating) return;

    const userPrompt = inputText.trim();
    setInputText("");
    setActiveError(null);

    const newMessages: ChatMessageItem[] = [
      ...messages,
      { role: "user", content: userPrompt },
    ];
    setMessages(newMessages);

    // Placeholder assistant message for streaming
    const assistantMsgIndex = newMessages.length;
    const updatedWithPlaceholder = [
      ...newMessages,
      { role: "assistant" as const, content: "" },
    ];
    setMessages(updatedWithPlaceholder);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          providerSlug: selectedProvider,
          model: selectedModel,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: currentConversationId || undefined,
          temperature,
          maxTokens,
          systemPrompt: systemPrompt || undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || `Request failed with HTTP ${response.status}`
        );
      }

      // Check if response is streaming SSE
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") break;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    setMessages((prev) => {
                      const copy = [...prev];
                      copy[assistantMsgIndex] = {
                        ...copy[assistantMsgIndex],
                        content: accumulated,
                        latencyMs: Date.now() - startTime,
                      };
                      return copy;
                    });
                  }
                } catch {
                  // Ignore JSON parse errors for split chunk frames
                }
              }
            }
          }
        }
      } else {
        // Non-streaming response fallback
        const data = await response.json();
        setMessages((prev) => {
          const copy = [...prev];
          copy[assistantMsgIndex] = {
            ...copy[assistantMsgIndex],
            content: data.content,
            latencyMs: data.latencyMs,
            tokenUsageCompletion: data.usage?.completionTokens,
          };
          return copy;
        });
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Stopped by user
      } else {
        setActiveError({
          message: err.message || "Failed to generate response.",
          suggestedAction:
            "Make sure your provider API key is connected in the Key Center and that your quota has not been exceeded.",
        });
        // Remove empty placeholder assistant message
        setMessages((prev) => prev.filter((_, idx) => idx !== assistantMsgIndex));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedModelObj = models.find((m) => m.slug === selectedModel);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7.5rem)] min-h-[600px]">
      {/* Left Sidebar: Conversations & Settings (Hidden on mobile or toggled) */}
      <div className="hidden lg:flex flex-col w-64 rounded-2xl border border-border/80 bg-zinc-900/40 p-3.5 space-y-3">
        <button
          onClick={startNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">
            History
          </span>
          {conversations.length === 0 ? (
            <p className="text-xs text-zinc-500 px-2 py-4">No saved chats yet</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setCurrentConversationId(c.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer group transition-colors ${
                  currentConversationId === c.id
                    ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <span className="truncate flex-1">{c.title || "Conversation"}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(c.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Model Spec Quick Widget */}
        {selectedModelObj && (
          <div className="rounded-xl border border-border/60 bg-zinc-950/60 p-3 space-y-1.5 text-[11px]">
            <span className="font-semibold text-zinc-300 block">Model Capabilities</span>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Context:</span>
              <span className="font-mono text-zinc-300">{formatNumber(selectedModelObj.contextWindow)}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Tier:</span>
              <span className="text-emerald-400 font-medium">
                {selectedModelObj.freeTierStatus === "RECURRING_FREE" ? "Free" : "Standard"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center & Main Chat Interface */}
      <div className="flex-1 flex flex-col rounded-2xl border border-border/80 bg-zinc-900/50 overflow-hidden">
        {/* Top Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border/70 bg-zinc-900/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Provider Selector */}
            <select
              value={selectedProvider}
              onChange={(e) => {
                const nextP = e.target.value;
                setSelectedProvider(nextP);
                const matching = models.filter((m) => (m.providerSlug || m.provider?.slug) === nextP);
                if (matching.length > 0) setSelectedModel(matching[0].slug);
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            >
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} {p.isConnected ? "✓" : ""}
                </option>
              ))}
            </select>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold max-w-[200px] sm:max-w-[260px] truncate"
            >
              {availableModelsForProvider.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                showSettings
                  ? "bg-purple-600/20 text-purple-300 border-purple-500/40"
                  : "border-border text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Parameters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Parameter Drawer */}
        {showSettings && (
          <div className="p-4 border-b border-border/60 bg-zinc-950/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in slide-in-from-top-2">
            <div className="space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Temperature</span>
                <span className="font-mono text-zinc-200">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Max Output Tokens</span>
                <span className="font-mono text-zinc-200">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <span className="text-zinc-400 block">System Prompt</span>
              <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="e.g. You are an expert TypeScript engineer..."
                className="w-full px-2.5 py-1 rounded-md border border-border bg-zinc-900 text-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {activeError && (
          <div className="p-3 bg-rose-950/40 border-b border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Provider Error:</span> {activeError.message}
              {activeError.suggestedAction && (
                <p className="text-[11px] text-zinc-400">{activeError.suggestedAction}</p>
              )}
            </div>
            <Link
              href="/keys"
              className="ml-auto text-purple-400 hover:underline shrink-0 font-medium inline-flex items-center gap-1"
            >
              Configure Keys <KeyRound className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white">Universal AI Playground</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Send prompts directly to {selectedModelObj?.name || selectedModel} via official provider API adapters. Real streaming responses and token tracking.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  "Write a Rust function to parse JSON safely",
                  "Explain quantum entanglement with an analogy",
                  "Compare the trade-offs of microservices vs monoliths",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setInputText(preset);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border/80 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs text-left transition-colors"
                  >
                    &quot;{preset}&quot;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-purple-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-tr-none"
                      : "bg-zinc-900/90 border border-border/80 text-zinc-200 rounded-tl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs sm:text-sm">
                    {msg.content || (isGenerating && idx === messages.length - 1 ? (
                      <span className="inline-flex items-center gap-1.5 text-zinc-400">
                        <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                        Generating response...
                      </span>
                    ) : (
                      ""
                    ))}
                  </div>

                  {/* Message Metadata & Copy Action */}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-2 font-mono">
                        {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                        {msg.tokenUsageCompletion && <span>• {msg.tokenUsageCompletion} tokens</span>}
                      </div>

                      <button
                        onClick={() => copyToClipboard(msg.content, `msg-${idx}`)}
                        className="hover:text-zinc-300 inline-flex items-center gap-1 transition-colors"
                        title="Copy message"
                      >
                        {copiedId === `msg-${idx}` ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 border border-border/80 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-zinc-300" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-border/70 bg-zinc-900/80">
          <div className="relative flex items-center">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={`Message ${selectedModel}... (Press Enter to send, Shift+Enter for new line)`}
              className="w-full resize-none rounded-xl border border-border bg-zinc-950/80 pl-3.5 pr-20 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  title="Stop generation"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all shadow-md shadow-purple-500/20"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-zinc-900/30 animate-pulse" />}>
      <PlaygroundContent />
    </Suspense>
  );
}
