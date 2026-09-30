// Optional access-code gate. If APP_ACCESS_CODE is set on the server, each
// device must enter it once; afterwards a long-lived cookie remembers it.
// If it's unset, the app is open.

export const ACCESS_COOKIE = "sp_access";

export async function accessToken(code: string): Promise<string> {
  const data = new TextEncoder().encode(`sparring-partner:${code}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
