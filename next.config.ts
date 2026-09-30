import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is served fresh from the server. There is no service worker,
  // so a new deploy is what you see the next time you open the app.
  poweredByHeader: false,
};

export default nextConfig;
