import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    // Provide a default guest/developer session if user hasn't explicitly logged in
    return NextResponse.json({
      user: {
        id: "demo-user",
        email: "developer@aicenter.dev",
        name: "AI Developer",
        role: "USER",
        isGuest: true,
      },
    });
  }

  return NextResponse.json({ user, success: true });
}
