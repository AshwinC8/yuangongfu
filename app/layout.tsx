import type { Metadata } from "next";
import { albertSans, outfitNoCrossbar } from "./fonts";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yuan Gong Fu",
  description: "Yuan Gong Fu",
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
      </body>
    </html>
  );
}
