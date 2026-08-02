import type { Metadata, Viewport } from "next";
import { ChunkLoadRecoveryScript } from "@/components/ChunkLoadRecoveryScript";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Вечера",
  description:
    "Сочное меню, вафли и сэндвичи. Заказ онлайн, доставка, две точки в Беслане.",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#281300",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <ChunkLoadRecoveryScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
