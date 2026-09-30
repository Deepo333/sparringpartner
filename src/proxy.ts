import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";

export async function proxy(req: NextRequest) {
  const code = process.env.APP_ACCESS_CODE;
  if (!code) return NextResponse.next();

  const cookie = req.cookies.get(ACCESS_COOKIE)?.value;
  if (cookie && cookie === (await accessToken(code))) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Locked. Enter your access code." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the unlock page itself and static files.
  matcher: ["/((?!unlock|api/unlock|_next/|favicon|icon|apple-icon).*)"],
};
