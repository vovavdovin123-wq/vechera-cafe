import { Header } from "@/components/Header";
import { LocationBanner } from "@/components/LocationBanner";
import { PromoCarousel } from "@/components/PromoCarousel";
import { Hero } from "@/components/Hero";
import { MenuSection } from "@/components/MenuSection";
import { InteriorSection } from "@/components/InteriorSection";
import { LocationSection } from "@/components/LocationSection";
import { FeedbackSection } from "@/components/FeedbackSection";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LocationBanner />
        <PromoCarousel />
        <MenuSection />
        <InteriorSection />
        <LocationSection />
        <FeedbackSection />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
