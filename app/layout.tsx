import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { getPrimaryStore } from "@/lib/storefront";
import { CartProvider } from "./cart-context";
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
  const store = await getPrimaryStore();

  return (
    <html
      lang="es-AR"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <CartProvider storeName={store?.name} storeWhatsapp={store?.whatsapp}>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
