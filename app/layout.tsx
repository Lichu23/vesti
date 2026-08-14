import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { getPrimaryStore, getStorefrontNavigation } from "@/lib/storefront";
import { CartProvider } from "./cart-context";
import { StorefrontNavigation } from "./storefront-navigation";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thoemia Intimo",
  description: "Catalogo online de Thoemia Intimo",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [store, storefrontNavigation] = await Promise.all([
    getPrimaryStore(),
    getStorefrontNavigation(),
  ]);

  return (
    <html
      lang="es-AR"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider storeName={store?.name} storeWhatsapp={store?.whatsapp}>
          <Suspense fallback={children}>
            <StorefrontNavigation
              categoryGroups={storefrontNavigation.audienceCategories}
            >
              {children}
            </StorefrontNavigation>
          </Suspense>
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
