import "./colors.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { cx } from "class-variance-authority";
import Footer from "./footer";
import Header from "./header";
import dynamic from "next/dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixeleye",
  description:
    "Open-source, self-hostable, platform for visual regression testing.",
};

const PageViews = dynamic(() => import('./pageViews'), {
  ssr: false,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#fdf8fd" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111111" media="(prefers-color-scheme: dark)" />

      </head>
      <body
        className={cx(
          inter.className,
          "dark:selection:bg-teal-950 dark:selection:text-teal-50 selection:bg-teal-600 selection:text-teal-50"
        )}
      >
        <Providers>
          <PageViews />
          <Header />
          <div className="lg:pt-[4.5rem] pt-16">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
