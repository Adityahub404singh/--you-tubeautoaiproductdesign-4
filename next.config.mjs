/** @type {import("next").NextConfig} */
const nextConfig = {
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
