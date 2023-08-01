import "./colors.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { cx } from "class-variance-authority";
import Header from "./header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cx(
          inter.className,
          "selection:bg-teal-950 selection:text-teal-50"
        )}
      >
        <Providers>
          <Header />
          <div className="lg:pt-0 pt-16">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
