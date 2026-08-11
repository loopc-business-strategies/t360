import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { Providers } from "../components/providers";
import { AdminShell } from "../components/admin-shell";
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
  title: "THARAGAI Admin",
  description: "Tharagai Digital admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body className="tharagai-surface antialiased">
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
