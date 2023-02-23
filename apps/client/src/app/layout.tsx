import "~/styles/globals.css";
import { Inter } from "@next/font/google";
import { themeScript } from "@pixeleye/hooks";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // could be some API route / getServerSideProps / ...

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-gray-900" style={inter.style}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
