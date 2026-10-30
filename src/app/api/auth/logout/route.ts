import { NextResponse } from "next/server";
import { getLogoutCookieConfig } from "@/lib/auth";

export async function POST() {
  const cookieConfig = getLogoutCookieConfig();
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  res.cookies.set(cookieConfig.name, cookieConfig.value, cookieConfig);
  return res;
}
