import "./colors.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { cx } from "class-variance-authority";
import Footer from "./footer";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pixeleye",
  description: "Open-source, self-hostable, platform for visual regression testing.",
};

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
      </head>
      <body
        className={cx(
          inter.className,
          "selection:bg-teal-950 selection:text-teal-50"
        )}
      >
        <Providers>
          <Header />
          <div className="pt-16">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
