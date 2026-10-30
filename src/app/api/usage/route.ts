import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";
  const records = await getUserUsageStats(userId);

  const totalPromptTokens = records.reduce((acc: number, r: any) => acc + (r.promptTokens || 0), 0);
  const totalCompletionTokens = records.reduce((acc: number, r: any) => acc + (r.completionTokens || 0), 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  const avgLatency = records.length > 0
    ? Math.round(records.reduce((acc: number, r: any) => acc + (r.latencyMs || 0), 0) / records.length)
    : 0;

  // Group by provider
  const byProvider: Record<string, number> = {};
  for (const r of records) {
    byProvider[r.providerId] = (byProvider[r.providerId] || 0) + (r.totalTokens || 1);
  }

  return NextResponse.json({
    records,
    summary: {
      totalRequests: records.length,
      totalTokens,
      totalPromptTokens,
      totalCompletionTokens,
      avgLatencyMs: avgLatency,
      byProvider,
    },
  });
}
