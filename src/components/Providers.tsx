"use client";

import { FranchiseWelcomeGate } from "@/components/FranchiseWelcomeGate";
import { CartProvider } from "@/context/CartContext";
import { FranchiseProvider } from "@/context/FranchiseContext";
import { InteriorProvider } from "@/context/InteriorContext";
import { MenuProvider } from "@/context/MenuContext";
import { PromoProvider } from "@/context/PromoContext";
import { SearchProvider } from "@/context/SearchContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FranchiseProvider>
      <MenuProvider>
        <PromoProvider>
          <InteriorProvider>
            <SearchProvider>
              <CartProvider>
                <FranchiseWelcomeGate />
                {children}
              </CartProvider>
            </SearchProvider>
          </InteriorProvider>
        </PromoProvider>
      </MenuProvider>
    </FranchiseProvider>
  );
}
