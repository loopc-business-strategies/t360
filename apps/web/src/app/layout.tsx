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

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveSiteUrl(): string {
  const fallback =
    process.env.NODE_ENV === "production" ? "https://t360-web.vercel.app" : "http://localhost:3000";

  const candidates: string[] = [];
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) candidates.push(explicit);

  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/\/$/, "");
  if (prodHost) {
    candidates.push(prodHost.startsWith("http") ? prodHost : `https://${prodHost}`);
  }

  const vercelHost = process.env.VERCEL_URL?.trim().replace(/\/$/, "");
  if (vercelHost) {
    candidates.push(vercelHost.startsWith("http") ? vercelHost : `https://${vercelHost}`);
  }

  for (const candidate of candidates) {
    if (isHttpUrl(candidate)) return candidate;
    if (!candidate.includes("://") && isHttpUrl(`https://${candidate}`)) {
      return `https://${candidate}`;
    }
  }

  return fallback;
}

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "THARAGAI Readymades — Pudukkottai",
    template: "%s · THARAGAI",
  },
  description:
    "Official THARAGAI Readymades storefront from Pudukkottai — wedding wear, ethnic fashion, and everyday elegance. Customer accounts use mobile OTP for this store only.",
  applicationName: "THARAGAI Readymades",
  authors: [{ name: "THARAGAI Readymades" }],
  creator: "THARAGAI Readymades",
  publisher: "THARAGAI Readymades",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "THARAGAI Readymades",
    title: "THARAGAI Readymades — Pudukkottai",
    description:
      "Official family fashion storefront from Pudukkottai. Shop wedding wear, ethnic sets, and everyday elegance.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "THARAGAI Fashion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "THARAGAI Readymades — Pudukkottai",
    description:
      "Official family fashion storefront from Pudukkottai. Shop wedding wear, ethnic sets, and everyday elegance.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "THARAGAI Readymades",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description:
    "Official THARAGAI Readymades ecommerce storefront from Pudukkottai — wedding wear, ethnic fashion, and everyday elegance.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Pudukkottai",
    addressRegion: "Tamil Nadu",
    addressCountry: "IN",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "THARAGAI Readymades",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${newsreader.variable}`}>
      <body className="tharagai-surface antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
