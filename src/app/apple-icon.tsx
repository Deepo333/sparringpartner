import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon for "Add to Home Screen" on iPhone.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1a1f1d" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d="M32 8c-12.7 0-21 8.6-21 20.5C11 42 23 56 32 56s21-14 21-27.5C53 16.6 44.7 8 32 8z" fill="#a9b5af" />
          <ellipse cx="23.5" cy="32" rx="7.5" ry="4.2" transform="rotate(28 23.5 32)" fill="#111514" />
          <ellipse cx="40.5" cy="32" rx="7.5" ry="4.2" transform="rotate(-28 40.5 32)" fill="#111514" />
        </svg>
      </div>
    ),
    size,
  );
}
