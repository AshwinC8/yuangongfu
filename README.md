# Yuan Gong Fu — Website

Next.js (App Router, TypeScript) build. We're assembling it section by section.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's built so far

- **Fonts wired up**
  - `Albert Sans` (Google) → body/UI text, exposed as `--font-albert-sans`
  - `Outfit No-Crossbar` (your local `.woff2`) → the YUANGONGFU wordmark, exposed as `--font-outfit-nocrossbar`
- **Sticky navbar** (`components/Navbar.tsx`)
  - Stays pinned at the top while scrolling
  - Transparent at the top; gains a blurred/elevated background once you scroll
  - Desktop links + CTA, responsive hamburger menu on mobile

## Where to tweak

- **Colors / spacing / sizes** → `app/globals.css` (`:root` design tokens). These are
  placeholders until the navbar design is matched.
- **Nav links / CTA label** → `NAV_LINKS` array at the top of `components/Navbar.tsx`.
- **Custom font file** → `app/fonts/Outfit-NoCrossbarA.woff2`.

## Project structure

```
app/
  fonts.ts          # font loading (next/font)
  fonts/            # local .woff2
  globals.css       # design tokens + base styles
  layout.tsx        # applies font CSS variables
  page.tsx          # home page (placeholder scroll demo)
components/
  Navbar.tsx
  Navbar.module.css
```
