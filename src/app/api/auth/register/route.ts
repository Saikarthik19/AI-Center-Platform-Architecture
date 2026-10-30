import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, createSessionToken, getSessionCookieConfig } from "@/lib/auth";
import { prisma, checkDbConnection } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name } = validated.data;
    const hasDb = await checkDbConnection();

    let user: any = null;

    if (hasDb) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split("@")[0],
          role: "USER",
        },
      });
    } else {
      user = {
        id: `user-${Date.now()}`,
        email,
        name: name || email.split("@")[0],
        role: "USER",
      };
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
      { error: "Registration failed", message: err.message },
      { status: 500 }
    );
  }
}
