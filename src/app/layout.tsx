import type { Metadata } from "next";
import { Nunito, Lora } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-heading",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Catalogue",
  description: "A family recipe collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${lora.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
