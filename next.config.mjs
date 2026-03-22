import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      { source: "/storage/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000" }] }
    ];
  },
  async rewrites() {
    return [
      { source: "/storage/:path*", destination: "/api/storage/:path*" }
    ];
  },
};
export default nextConfig;
