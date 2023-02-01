// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds and Linting.
 */
!process.env.SKIP_ENV_VALIDATION && (await import("./src/env.mjs"));

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@pixeleye/api",
    "@pixeleye/auth",
    "@pixeleye/db",
    "@pixeleye/utils",
    "@pixeleye/hooks",
    "@pixeleye/ui",
  ],
  images: {
    domains: ["images.unsplash.com"],
  },
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: { ignoreBuildErrors: !!process.env.CI },
  experimental: {
    appDir: true,
    scrollRestoration: true,
  },
};

export default config;
