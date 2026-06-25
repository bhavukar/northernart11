import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://northernart11.com"),
  title: "northernart11 | Fine Art Gallery",
  description: "A minimal, high-end online gallery showcasing a curated collection of contemporary Indian fine art and abstract masterpieces.",
  keywords: ["fine art", "contemporary art", "Indian art", "paintings", "buy art online", "exclusive art collection", "northernart11"],
  authors: [{ name: "northernart11" }],
  openGraph: {
    title: "northernart11 | Fine Art Gallery",
    description: "A minimal, high-end online gallery showcasing a curated collection of contemporary Indian fine art and abstract masterpieces.",
    url: "https://northernart11.com",
    siteName: "northernart11",
    images: [
      {
        url: "/indian_art_hero.png",
        width: 1200,
        height: 1500,
        alt: "Featured Indian Contemporary Artwork",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "northernart11 | Fine Art Gallery",
    description: "A minimal, high-end online gallery showcasing a curated collection of contemporary Indian fine art and abstract masterpieces.",
    images: ["/indian_art_hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#111111]">{children}</body>
    </html>
  );
}
