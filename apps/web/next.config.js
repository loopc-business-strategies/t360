const path = require("path");

if (process.env.VERCEL === "1") {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!apiUrl || apiUrl.includes("localhost")) {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be set to a live Railway API URL for Vercel builds",
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@t360/ui"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
