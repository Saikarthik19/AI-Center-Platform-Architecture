import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AI Center — All-in-One AI Model & API Hub",
  description:
    "Centralized developer platform to discover AI models, explore API providers, manage secure keys, benchmark latency, and chat in an interactive playground.",
  keywords: [
    "AI Models",
    "LLM Playground",
    "API Key Hub",
    "Google Gemini",
    "Groq",
    "OpenRouter",
    "Mistral AI",
    "Cloudflare Workers AI",
    "Hugging Face",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen bg-[#07070a]`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
