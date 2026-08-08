import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Сборка во временную папку (deploy.sh), чтобы не удалять .next пока сайт работает
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Убирает логотип Next.js Dev Tools в левом нижнем углу (только в dev)
  devIndicators: false,
  // Windows: segment explorer ломает dev-кэш → 500 и CSS 404 после долгой работы
  experimental: {
    devtoolSegmentExplorer: false,
  },
  // Запросы через nginx/домен (не только localhost)
  allowedDevOrigins: ["vechera-cafe.ru", "www.vechera-cafe.ru"],
  // Старые ссылки /uploads/... → API-раздача файлов
  async rewrites() {
    return [
      {
        source: "/uploads/:name*",
        destination: "/api/uploads/:name*",
      },
      {
        source: "/favicon.ico",
        destination: "/favicon-32.png",
      },
    ];
  },
  webpack: (config, { dev }) => {
    // Webpack dev-кэш на Windows часто ломается → __webpack_modules__ is not a function
    if (dev) config.cache = false;
    return config;
  },
};

export default nextConfig;
