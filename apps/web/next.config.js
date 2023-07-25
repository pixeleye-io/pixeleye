/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pixeleye/ui", "@pixeleye/api", "@pixeleye/tailwind"],
  rewrites: async () => [
    {
      source: "/api/:path*",
      destination: "http://127.0.0.1:5000/api/:path*",
    },
  ],
  output: process.env.PX_HOST === "docker" ? "standalone" : undefined,
  images: {
    domains: ["avatars.githubusercontent.com", "avatar.vercel.sh"],
  },
};

module.exports = nextConfig;
