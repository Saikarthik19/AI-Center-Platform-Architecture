import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getConversationWithMessages, deleteConversation } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";

  const conversation = await getConversationWithMessages(userId, params.id);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  const userId = user?.id || "demo-user";

  const success = await deleteConversation(userId, params.id);
  if (!success) {
    return NextResponse.json(
      { error: "Could not delete conversation or unauthorized" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, message: "Conversation deleted" });
}
