import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, createConversation } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";
  const conversations = await getConversations(userId);
  return NextResponse.json({ conversations });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || "demo-user";

    const body = await req.json();
    const conv = await createConversation(userId, {
      title: body.title || "New Conversation",
      providerId: body.providerId || "google",
      modelId: body.modelId || "gemini-1.5-flash",
      systemPrompt: body.systemPrompt,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });

    return NextResponse.json({ conversation: conv });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create conversation", message: err.message },
      { status: 500 }
    );
  }
}
