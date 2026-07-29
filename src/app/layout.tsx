import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Вечера — кафе",
  description:
    "Кафе на сквере: сочное меню, вафли и сэндвичи. Заказ онлайн, доставка, две точки в Беслане.",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
