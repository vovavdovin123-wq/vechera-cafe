"use client";

import { ChunkLoadRecovery } from "@/components/ChunkLoadRecovery";
import { FranchiseEntryGuard } from "@/components/FranchiseEntryGuard";
import { CartProvider } from "@/context/CartContext";
import { FranchiseProvider } from "@/context/FranchiseContext";
import { InteriorProvider } from "@/context/InteriorContext";
import { MenuProvider } from "@/context/MenuContext";
import { PromoProvider } from "@/context/PromoContext";
import { SearchProvider } from "@/context/SearchContext";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FranchiseProvider>
      <UserProvider>
        <MenuProvider>
          <PromoProvider>
            <InteriorProvider>
              <SearchProvider>
                <CartProvider>
                  <ChunkLoadRecovery />
                  <FranchiseEntryGuard>{children}</FranchiseEntryGuard>
                </CartProvider>
              </SearchProvider>
            </InteriorProvider>
          </PromoProvider>
        </MenuProvider>
      </UserProvider>
    </FranchiseProvider>
  );
}
