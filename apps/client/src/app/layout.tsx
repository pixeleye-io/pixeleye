import "~/styles/globals.css";
import { themeScript } from "@pixeleye/hooks";
import Providers from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-white dark:bg-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
