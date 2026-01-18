import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/spacejoy-main/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/spacejoy/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.1.3"],
    },
  },
};

export default nextConfig;
