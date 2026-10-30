import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, createSessionToken, getSessionCookieConfig } from "@/lib/auth";
import { prisma, checkDbConnection } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid email or password format", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const hasDb = await checkDbConnection();

    let user: any = null;

    if (hasDb) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await comparePassword(password, user.passwordHash))) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
    } else {
      // Demo / fallback credentials
      if (email === "developer@aicenter.dev" && password === "developer123") {
        user = {
          id: "demo-user",
          email: "developer@aicenter.dev",
          name: "AI Developer",
          role: "USER",
        };
      } else {
        // Auto-provision demo session for any valid login in offline/local mode
        user = {
          id: `user-${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
          email,
          name: email.split("@")[0],
          role: "USER",
        };
      }
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      role: user.role || "USER",
    };

    const token = await createSessionToken(sessionUser);
    const cookieConfig = getSessionCookieConfig(token);

    const res = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    res.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig);
    return res;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Authentication failed", message: err.message },
      { status: 500 }
    );
  }
}
