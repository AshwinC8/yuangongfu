import { Albert_Sans } from "next/font/google";
import localFont from "next/font/local";

// Body / UI typeface — Albert Sans from Google Fonts.
// next/font/google self-hosts and optimizes it automatically.
export const albertSans = Albert_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-albert-sans",
  display: "swap",
});

// Display / brand typeface — the custom "Outfit No-Crossbar" used for the
// YUANGONGFU wordmark. Loaded locally from the supplied .woff2.
export const outfitNoCrossbar = localFont({
  src: "./fonts/Outfit-NoCrossbarA.woff2",
  variable: "--font-outfit-nocrossbar",
  display: "swap",
  weight: "100 900",
});
