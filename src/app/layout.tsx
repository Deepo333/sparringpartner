import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sparring Partner",
  description: "Don't just tell me what I believe. Make me defend it.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111514" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topbar">
          <Link href="/" className="brand">
            <span aria-hidden>👽</span> Sparring Partner
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
