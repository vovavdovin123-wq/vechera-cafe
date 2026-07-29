import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убирает логотип Next.js Dev Tools в левом нижнем углу (только в dev)
  devIndicators: false,
  // Запросы через nginx/домен (не только localhost)
  allowedDevOrigins: ["vechera-cafe.ru", "www.vechera-cafe.ru"],
  // Старые ссылки /uploads/... → API-раздача файлов
  async rewrites() {
    return [
      {
        source: "/uploads/:name*",
        destination: "/api/uploads/:name*",
      },
    ];
  },
};

export default nextConfig;
