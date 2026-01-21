/** @type {import('next').NextConfig} */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: allowedOrigins.length ? allowedOrigins : ["*"] },
  },
};

export default nextConfig;
