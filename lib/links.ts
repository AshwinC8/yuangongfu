// Shared destinations used across CTAs so they stay consistent in one place.
export const CONTACT_EMAIL = "tugdual.belbeoch@gmail.com";
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

// Production origin — used for canonical URLs, Open Graph tags, sitemap & robots.
// Override per environment with NEXT_PUBLIC_SITE_URL; update the fallback below
// to the real domain once it's live.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.yuangongfu.com"
).replace(/\/$/, "");

// Real, verified public profiles only (used for SEO `sameAs` / structured data).
// The footer's YouTube/LinkedIn links are still placeholders, so they're omitted
// here on purpose — add them once the real channel/profile URLs exist.
export const SOCIAL_PROFILES = [
  "https://www.instagram.com/yuangongfu",
  "https://www.facebook.com/p/YUAN-Gong-Fu-100072486010751/",
];

// "Join a class" booking system (opens in a new tab).
export const CLASS_BOOKING_URL =
  "https://book.pure-informatique.com/Class/FindClass.php?locationID=43045&sid=1ptjorsf96qj3ulaqlqh7ahfhk";
