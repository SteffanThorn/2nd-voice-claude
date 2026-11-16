import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // eSpeak NG ships a WebAssembly file it loads from its own folder at runtime,
  // so it must be required from node_modules rather than bundled.
  serverExternalPackages: ["espeak-ng"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
