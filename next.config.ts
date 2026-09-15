import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // this repo is the workspace root (a stray lockfile exists in $HOME)
  turbopack: { root: __dirname },
  // onnxruntime-node ships native binaries — leave it external to the bundle
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
