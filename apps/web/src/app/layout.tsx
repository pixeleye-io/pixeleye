import "./colors.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { cx } from "class-variance-authority";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixeleye",
  description:
    "Pixeleye is an open-source, self-hostable platform for visual regression testing. Deliver pixel perfect UIs with confidence, effortlessly catching visual bugs before they reach production.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body
        className={cx(
          inter.className,
          "dark:selection:bg-teal-950 dark:selection:text-teal-50 selection:bg-teal-600 selection:text-teal-50 h-full"
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
