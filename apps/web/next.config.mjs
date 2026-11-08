/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@pdf-to-audio/shared"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  webpack: (config) => {
    config.externals.push({
      bcryptjs: "commonjs bcryptjs",
    });
    return config;
  },
};

export default nextConfig;

