# AI Center — All-in-One AI Model & API Hub

AI Center is a centralized developer directory, key vault, and interactive playground where engineers can discover foundation models, explore API providers, connect their own API keys securely, benchmark latency side-by-side, and chat with AI models from a unified dark-mode dashboard.

---

## Key Features

1. **AI Model Directory**: Search and filter 35+ verified models across 8 categories (Chat, Reasoning, Coding, Multimodal, Image, Audio, Embeddings, Reranking) by context window, pricing, modality, and open-weights status.
2. **Dedicated Free AI Discovery**: Strictly distinguishes recurring free tiers, limited community quotas, trial credits, and edge compute limits.
3. **Universal AI Playground**: Real streaming chat with SSE, token tracking, latency counters, system prompt overrides, temperature controls, and error remediation tips.
4. **Zero-Knowledge API Key Center**: Bring Your Own Key (BYOK) architecture. Keys are encrypted at rest with **AES-256-GCM** using a master key kept outside the database. Keys are masked in the UI (`gsk_...3a9f`) and redacted from logs.
5. **Multi-Model Latency Benchmarking**: Compare 2 to 4 models simultaneously with side-by-side spec comparison and live parallel prompt execution.
6. **Production Provider Adapters**: Out-of-the-box adapters for:
   - **Google Gemini API** (`gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash-exp`)
   - **Groq LPU Engine** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`)
   - **OpenRouter** (`meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`, `claude-3.5-sonnet`)
   - **Cloudflare Workers AI** (`@cf/meta/llama-3.1-8b-instruct`, `@cf/stabilityai/stable-diffusion-xl-base-1.0`)
   - **Mistral AI** (`mistral-small-latest`, `codestral-latest`, `mistral-large-latest`)
   - **Hugging Face Inference** (`Qwen/Qwen2.5-Coder-32B-Instruct`, `Llama-3.2-3B-Instruct`, `FLUX.1-schnell`)
7. **Interactive API Documentation**: Working copy-paste code snippets for Python, TypeScript/JavaScript, and cURL for all providers.
8. **Live Telemetry & Usage Logs**: Track prompt/completion tokens, requests, and latency averages across providers.

---

## Security Architecture

- **Authenticated Encryption**: Saved provider credentials use AES-256-GCM authenticated cipher with unique 96-bit random IVs and 128-bit authentication tags.
- **SSRF Hardening**: Outbound provider API requests are strictly validated against an allowed hostnames list. Localhost (127.0.0.1) and private IP ranges (10.x, 192.168.x, 169.254.x) are blocked before any network socket is opened.
- **Secret Redaction Pipeline**: Server logs and error responses are stripped of known API key patterns (Google Gemini, Groq, OpenRouter, Mistral, HuggingFace, Bearer tokens).
- **No Client Storage**: API keys are never stored in localStorage, sessionStorage, query strings, or client cookies.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS with dark gradients & purple/blue accents
- **ORM & Database**: Prisma ORM with PostgreSQL (plus built-in resilient in-memory fallback for zero-friction local development)
- **Authentication**: Stateless HTTP-only JWT sessions with `jose` & `bcryptjs`
- **Validation**: Zod
- **Testing**: Vitest unit & integration test suite

---

## Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v18.17.0+ or v20+ (tested on Node v22)
- **npm**: v9+
- **PostgreSQL**: (Optional for production persistence; application starts instantly with zero configuration using the in-memory engine)

### 2. Installation

Clone and install dependencies:
\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration

Copy the sample environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

Generate a 64-character hex master encryption key:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

Set this value as `ENCRYPTION_MASTER_KEY` in your `.env`.

### 4. Database Setup (PostgreSQL with Prisma)

If you have a running PostgreSQL instance:
\`\`\`bash
# Generate the Prisma client
npm run prisma:generate

# Push the schema to PostgreSQL
npm run prisma:push

# Seed initial providers and models
npm run prisma:seed
\`\`\`

> **Note**: If PostgreSQL is not configured yet, the app runs cleanly in self-contained mode with all 35+ models, providers, and key testing capabilities fully accessible.

### 5. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Automated Tests

AI Center includes a comprehensive Vitest test suite verifying cryptography, SSRF protection, secret redaction, model filtering, and authentication:

\`\`\`bash
npm test
\`\`\`

---

## Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

---

## Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **401 Unauthorized from Provider** | Trailing spaces or invalid API key | Re-enter key in API Key Center; check that account has an active key on the provider console. |
| **429 Rate Limit Exceeded** | Hit requests-per-minute (RPM) quota | Wait 60 seconds or upgrade your provider tier. |
| **SSRF Block error** | Request target is not in the trusted allowlist | Outbound destinations are restricted to verified provider hosts. Contact admin to add an allowlist entry. |
| **Prisma Connection Refused** | PostgreSQL service is not started | Start PostgreSQL or allow the app to run in zero-friction fallback mode. |

---

## License

MIT © AI Center Contributors
