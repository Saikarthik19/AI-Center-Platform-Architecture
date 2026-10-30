"use client";

import { useState } from "react";
import {
  BookOpen,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Code2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

type Language = "python" | "typescript" | "curl";

const PROVIDER_DOCS = [
  {
    slug: "google",
    name: "Google Gemini API",
    model: "gemini-1.5-flash",
    envVar: "GEMINI_API_KEY",
    install: {
      python: "pip install google-genai",
      typescript: "npm install @google/genai",
      curl: "# curl is pre-installed on Unix/macOS/Windows PowerShell",
    },
    minimal: {
      python: `import os
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content(
    model="gemini-1.5-flash",
    contents="Explain how quantum key distribution works in 2 sentences.",
)

print(response.text)`,
      typescript: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: "Explain how quantum key distribution works in 2 sentences.",
  });

  console.log(response.text);
}

main();`,
      curl: `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{"text": "Explain quantum key distribution in 2 sentences."}]
    }]
  }'`,
    },
    streaming: {
      python: `from google import genai
import os

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

response = client.models.generate_content_stream(
    model="gemini-1.5-flash",
    contents="Write a concise guide to Next.js App Router.",
)

for chunk in response:
    print(chunk.text, end="", flush=True)`,
      typescript: `import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function stream() {
  const streamResult = await ai.models.generateContentStream({
    model: "gemini-1.5-flash",
    contents: "Write a concise guide to Next.js App Router.",
  });

  for await (const chunk of streamResult) {
    process.stdout.write(chunk.text || "");
  }
}

stream();`,
      curl: `curl -N -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=$GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{"text": "Write a concise guide to Next.js App Router."}]
    }]
  }'`,
    },
  },
  {
    slug: "groq",
    name: "Groq LPU Engine",
    model: "llama-3.3-70b-versatile",
    envVar: "GROQ_API_KEY",
    install: {
      python: "pip install groq",
      typescript: "npm install groq-sdk",
      curl: "# curl standard HTTP client",
    },
    minimal: {
      python: `import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

chat_completion = client.chat.completions.create(
    messages=[
        {"role": "system", "content": "You are a concise code architect."},
        {"role": "user", "content": "How do I implement circuit breakers in Node.js?"}
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)`,
      typescript: `import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are a concise code architect." },
      { role: "user", content: "How do I implement circuit breakers in Node.js?" },
    ],
    model: "llama-3.3-70b-versatile",
  });

  console.log(completion.choices[0]?.message?.content);
}

main();`,
      curl: `curl -X POST "https://api.groq.com/openai/v1/chat/completions" \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [
      {"role": "user", "content": "How do I implement circuit breakers in Node.js?"}
    ]
  }'`,
    },
    streaming: {
      python: `import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

stream = client.chat.completions.create(
    messages=[{"role": "user", "content": "Stream a short story about an autonomous satellite."}],
    model="llama-3.3-70b-versatile",
    stream=True,
)

for chunk in stream:
    content = chunk.choices[0].delta.content or ""
    print(content, end="", flush=True)`,
      typescript: `import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function stream() {
  const stream = await groq.chat.completions.create({
    messages: [{ role: "user", content: "Stream a short story about an autonomous satellite." }],
    model: "llama-3.3-70b-versatile",
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

stream();`,
      curl: `curl -N -X POST "https://api.groq.com/openai/v1/chat/completions" \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "Stream a short story about an autonomous satellite."}],
    "stream": true
  }'`,
    },
  },
  {
    slug: "openrouter",
    name: "OpenRouter",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    envVar: "OPENROUTER_API_KEY",
    install: {
      python: "pip install openai",
      typescript: "npm install openai",
      curl: "# standard curl client",
    },
    minimal: {
      python: `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
)

completion = client.chat.completions.create(
    extra_headers={
        "HTTP-Referer": "https://aicenter.dev",
        "X-Title": "AI Center",
    },
    model="meta-llama/llama-3.3-70b-instruct:free",
    messages=[{"role": "user", "content": "What are vector embeddings in 1 sentence?"}],
)

print(completion.choices[0].message.content)`,
      typescript: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://aicenter.dev",
    "X-Title": "AI Center",
  },
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [{ role: "user", content: "What are vector embeddings in 1 sentence?" }],
  });

  console.log(completion.choices[0].message.content);
}

main();`,
      curl: `curl -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "HTTP-Referer: https://aicenter.dev" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/llama-3.3-70b-instruct:free",
    "messages": [{"role": "user", "content": "What are vector embeddings in 1 sentence?"}]
  }'`,
    },
    streaming: {
      python: `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.environ.get("OPENROUTER_API_KEY"),
)

stream = client.chat.completions.create(
    model="meta-llama/llama-3.3-70b-instruct:free",
    messages=[{"role": "user", "content": "Explain binary search in Python."}],
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)`,
      typescript: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function stream() {
  const stream = await openai.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [{ role: "user", content: "Explain binary search in Python." }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

stream();`,
      curl: `curl -N -X POST "https://openrouter.ai/api/v1/chat/completions" \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/llama-3.3-70b-instruct:free",
    "messages": [{"role": "user", "content": "Explain binary search in Python."}],
    "stream": true
  }'`,
    },
  },
  {
    slug: "mistral",
    name: "Mistral AI",
    model: "mistral-small-latest",
    envVar: "MISTRAL_API_KEY",
    install: {
      python: "pip install mistralai",
      typescript: "npm install @mistralai/mistralai",
      curl: "# standard curl client",
    },
    minimal: {
      python: `import os
from mistralai import Mistral

client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))

chat_response = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": "Write a haiku about compiling code."}],
)

print(chat_response.choices[0].message.content)`,
      typescript: `import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function main() {
  const response = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: "Write a haiku about compiling code." }],
  });

  console.log(response.choices[0].message.content);
}

main();`,
      curl: `curl -X POST "https://api.mistral.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $MISTRAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mistral-small-latest",
    "messages": [{"role": "user", "content": "Write a haiku about compiling code."}]
  }'`,
    },
    streaming: {
      python: `import os
from mistralai import Mistral

client = Mistral(api_key=os.environ.get("MISTRAL_API_KEY"))

stream_response = client.chat.stream(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": "Explain async/await in Python."}],
)

for chunk in stream_response:
    print(chunk.data.choices[0].delta.content or "", end="", flush=True)`,
      typescript: `import { Mistral } from "@mistralai/mistralai";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

async function stream() {
  const streamResponse = await client.chat.stream({
    model: "mistral-small-latest",
    messages: [{ role: "user", content: "Explain async/await in TypeScript." }],
  });

  for await (const chunk of streamResponse) {
    process.stdout.write(chunk.data.choices[0]?.delta?.content || "");
  }
}

stream();`,
      curl: `curl -N -X POST "https://api.mistral.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $MISTRAL_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mistral-small-latest",
    "messages": [{"role": "user", "content": "Explain async/await."}],
    "stream": true
  }'`,
    },
  },
];

export default function DocsPage() {
  const [selectedProviderSlug, setSelectedProviderSlug] = useState("google");
  const [selectedLang, setSelectedLang] = useState<Language>("python");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const provider = PROVIDER_DOCS.find((p) => p.slug === selectedProviderSlug) || PROVIDER_DOCS[0];

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
          <span>Interactive SDK & API Reference</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          API Documentation & Code Generator
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Production-tested code examples for Python, TypeScript/JavaScript, and cURL. Uses current official SDK formats and verified model identifiers.
        </p>
      </div>

      {/* Security Warning Callout */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300">Security Rule — Never commit secrets:</span>
          <p className="text-zinc-400">
            Never hardcode real API keys in source files or push <code className="text-amber-300">.env</code> files to git repositories. Always load secrets from environment variables or secure secret managers.
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-2">
          {PROVIDER_DOCS.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedProviderSlug(p.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedProviderSlug === p.slug
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "bg-zinc-900 border border-border text-zinc-400 hover:text-white"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Language Tabs */}
        <div className="flex items-center rounded-xl border border-border bg-zinc-900 p-1">
          {(["python", "typescript", "curl"] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                selectedLang === lang
                  ? "bg-zinc-800 text-purple-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Code Blocks */}
      <div className="space-y-6">
        {/* 1. Installation & Environment */}
        <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              1. Package Installation & Environment Setup
            </span>
            <button
              onClick={() => copyCode(provider.install[selectedLang], "install")}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
            >
              {copiedKey === "install" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedKey === "install" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-xs text-purple-300 overflow-x-auto border border-border/50">
            <code>{provider.install[selectedLang]}</code>
          </pre>

          <p className="text-[11px] text-zinc-400">
            Set your secret in terminal: <code className="text-zinc-200">export {provider.envVar}=&quot;your_key_here&quot;</code> (or Windows: <code className="text-zinc-200">$env:{provider.envVar}=&quot;your_key_here&quot;</code>)
          </p>
        </div>

        {/* 2. Minimal Chat Completion */}
        <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              2. Minimal Request ({provider.model})
            </span>
            <button
              onClick={() => copyCode(provider.minimal[selectedLang], "minimal")}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
            >
              {copiedKey === "minimal" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedKey === "minimal" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-200 overflow-x-auto border border-border/50">
            <code>{provider.minimal[selectedLang]}</code>
          </pre>
        </div>

        {/* 3. Streaming Chat Completion */}
        <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200">
              3. Real-Time Streaming Example
            </span>
            <button
              onClick={() => copyCode(provider.streaming[selectedLang], "streaming")}
              className="text-xs text-zinc-400 hover:text-white inline-flex items-center gap-1"
            >
              {copiedKey === "streaming" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedKey === "streaming" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <pre className="rounded-xl bg-zinc-950 p-4 font-mono text-xs text-emerald-300 overflow-x-auto border border-border/50">
            <code>{provider.streaming[selectedLang]}</code>
          </pre>
        </div>

        {/* 4. Common Errors & Rate-Limit Handling */}
        <div className="rounded-2xl border border-border/80 bg-zinc-900/50 p-5 space-y-3">
          <h3 className="text-xs font-bold text-zinc-200">4. Common Provider Errors & Solutions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-border/60 bg-zinc-950/70 space-y-1">
              <span className="font-semibold text-rose-400">401 Unauthorized / Invalid API Key</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Check that your key contains no leading/trailing spaces and that the provider account is verified. Reconnect in AI Center Key Center.
              </p>
            </div>
            <div className="p-3 rounded-xl border border-border/60 bg-zinc-950/70 space-y-1">
              <span className="font-semibold text-amber-400">429 Rate Limit / Quota Exceeded</span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                You have reached your RPM (requests/min) or TPM (tokens/min) limit. Implement exponential backoff retry with 1s, 2s, 4s intervals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
