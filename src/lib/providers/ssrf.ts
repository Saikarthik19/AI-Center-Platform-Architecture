import { NormalizedError } from "./types";
import { redactSecrets } from "../crypto";

const TRUSTED_DOMAINS = [
  "generativelanguage.googleapis.com",
  "api.groq.com",
  "openrouter.ai",
  "api.mistral.ai",
  "api.cloudflare.com",
  "api-inference.huggingface.co",
  "router.huggingface.co",
];

export function validateTargetUrl(urlStr: string): URL {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error("Invalid target URL format");
  }

  // Enforce HTTPS
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS requests are permitted to external AI providers");
  }

  // Prevent SSRF: Check hostname against allowlist
  const isAllowed = TRUSTED_DOMAINS.some(
    (allowed) => url.hostname === allowed || url.hostname.endsWith(`.${allowed}`)
  );

  if (!isAllowed) {
    throw new Error(`SSRF Block: Hostname '${url.hostname}' is not in the trusted provider allowlist`);
  }

  // Block localhost or private IP lookups
  if (
    url.hostname === "localhost" ||
    url.hostname.startsWith("127.") ||
    url.hostname.startsWith("192.168.") ||
    url.hostname.startsWith("10.") ||
    url.hostname === "169.254.169.254"
  ) {
    throw new Error("SSRF Block: Private and loopback addresses are strictly forbidden");
  }

  return url;
}

export function normalizeProviderError(error: any, providerName: string): NormalizedError {
  let message = "An unexpected provider error occurred.";
  let statusCode = 500;
  let code = "PROVIDER_ERROR";
  let suggestedAction = "Please check your network and provider configuration.";

  if (error instanceof Error) {
    message = error.message;
  }

  const raw =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
      ? error
      : JSON.stringify(error || {});

  if (raw.includes("401") || raw.includes("Unauthorized") || raw.includes("invalid_api_key") || raw.includes("API key not valid")) {
    statusCode = 401;
    code = "INVALID_CREDENTIALS";
    message = `Invalid or expired API key for ${providerName}.`;
    suggestedAction = `Verify your ${providerName} API key in the API Key Center. Make sure there are no trailing spaces and that your account is active.`;
  } else if (raw.includes("429") || raw.includes("quota") || raw.includes("rate_limit_exceeded") || raw.includes("RESOURCE_EXHAUSTED")) {
    statusCode = 429;
    code = "RATE_LIMIT_EXCEEDED";
    message = `Rate limit or quota exceeded for ${providerName}.`;
    suggestedAction = `You have hit the request or token rate limit for your tier on ${providerName}. Wait a minute or check your plan billing/quota.`;
  } else if (raw.includes("404") || raw.includes("model_not_found")) {
    statusCode = 404;
    code = "MODEL_NOT_FOUND";
    message = `Selected model is not available or deprecated on ${providerName}.`;
    suggestedAction = `Please choose another active model from the Discover Models catalog.`;
  } else if (raw.includes("SSRF Block")) {
    statusCode = 403;
    code = "FORBIDDEN_DESTINATION";
    message = redactSecrets(raw);
    suggestedAction = "Contact the administrator if you need a new AI provider endpoint allowlisted.";
  }

  return {
    statusCode,
    code,
    message: redactSecrets(message),
    suggestedAction,
  };
}
