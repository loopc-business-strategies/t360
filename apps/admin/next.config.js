const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@t360/ui"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
