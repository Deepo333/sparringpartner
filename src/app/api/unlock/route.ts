import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function POST(req: Request) {
  const form = await req.formData();
  const entered = String(form.get("code") ?? "");
  const code = process.env.APP_ACCESS_CODE;
  const url = new URL(req.url);

  if (!code || entered !== code) {
    return NextResponse.redirect(new URL("/unlock?wrong=1", url), 303);
  }
  const res = NextResponse.redirect(new URL("/", url), 303);
  res.cookies.set(ACCESS_COOKIE, await accessToken(code), {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
