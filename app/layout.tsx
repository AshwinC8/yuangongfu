import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { albertSans, outfitNoCrossbar } from "./fonts";
import ClientProviders from "@/components/ClientProviders";
import { SITE_URL, SOCIAL_PROFILES, CONTACT_EMAIL } from "@/lib/links";
import "./globals.css";

const TITLE = "Yuan Gong Fu — Internal Martial Arts in Lausanne";
const DESCRIPTION =
  "Internal martial arts in Lausanne with Tugdual Belbeoch — Tai Chi, Qi Gong, meditation & Sanda. Group classes, private & corporate sessions by Lake Geneva.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Yuan Gong Fu",
  },
  description: DESCRIPTION,
  applicationName: "Yuan Gong Fu",
  keywords: [
    "Yuan Gong Fu",
    "internal martial arts",
    "Tai Chi Lausanne",
    "Taijiquan",
    "Qi Gong",
    "meditation",
    "Xing Yi Quan",
    "Sanda",
    "gong fu",
    "martial arts Lausanne",
    "Wudang",
    "Tugdual Belbeoch",
    "Lake Geneva",
  ],
  authors: [{ name: "Tugdual Belbeoch" }],
  creator: "Tugdual Belbeoch",
  publisher: "Yuan Gong Fu",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Yuan Gong Fu",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: { icon: "/images/logo-icon.jpg", apple: "/images/logo-icon.jpg" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

// Structured data — a local martial-arts practice. Built only from facts present
// on the site (disciplines, instructor, venue, schedule, real social profiles).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "SportsActivityLocation"],
  "@id": `${SITE_URL}/#business`,
  name: "Yuan Gong Fu",
  alternateName: "YUAN GONG FU",
  description: DESCRIPTION,
  slogan: "Power begins in stillness",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo-icon.jpg`,
  image: `${SITE_URL}/opengraph-image`,
  telephone: "+41798570016",
  email: CONTACT_EMAIL,
  founder: { "@type": "Person", name: "Tugdual Belbeoch" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lausanne",
    addressRegion: "Vaud",
    addressCountry: "CH",
  },
  areaServed: [
    { "@type": "City", name: "Lausanne" },
    { "@type": "AdministrativeArea", name: "Lake Geneva region" },
  ],
  location: {
    "@type": "Place",
    name: "Beau-Rivage Palace",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lausanne",
      addressCountry: "CH",
    },
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Monday",
      opens: "18:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "17:00",
      closes: "18:30",
    },
  ],
  knowsAbout: [
    "Tai Chi",
    "Taijiquan",
    "Qi Gong",
    "Meditation",
    "Xing Yi Quan",
    "Sanda",
    "Internal martial arts",
    "Wudang tradition",
  ],
  sameAs: SOCIAL_PROFILES,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${albertSans.variable} ${outfitNoCrossbar.variable}`}
    >
      <body>
        <ClientProviders>{children}</ClientProviders>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Vercel Web Analytics — privacy-friendly, cookieless. To disable:
            remove this <Analytics /> line, or toggle Analytics off in the
            Vercel project dashboard (no redeploy needed). */}
        <Analytics />
      </body>
    </html>
  );
}
