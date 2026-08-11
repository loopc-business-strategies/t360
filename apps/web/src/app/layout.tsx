import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { Providers } from "../components/providers";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "THARAGAI Readymades — Pudukkottai",
    template: "%s · THARAGAI",
  },
  description:
    "Premium family fashion from Pudukkottai — sarees, wedding wear, and everyday elegance.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body className="tharagai-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
