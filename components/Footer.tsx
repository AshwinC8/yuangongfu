"use client";
/* eslint-disable @next/next/no-img-element */

import { useScrollContext } from "@/lib/scroll-context";
import { CONTACT_MAILTO, CLASS_BOOKING_URL } from "@/lib/links";
import WordmarkStrip from "./WordmarkStrip";
import PhoneCopy from "./PhoneCopy";
import styles from "./Footer.module.css";

type FooterItem = {
  label: string;
  section?: string;
  href?: string;
  external?: boolean;
};

// Cols 1 & 2 scroll to on-page sections; "Book a class" routes to the booking
// system; col 3 are legal pages (copy supplied later — placeholder hrefs).
const COLUMNS: FooterItem[][] = [
  [
    { label: "Philosophy", section: "philosophy" },
    { label: "The Practice", section: "practice" },
    { label: "Book a class", href: CLASS_BOOKING_URL, external: true },
  ],
  [
    { label: "Private session", section: "begin" },
    { label: "Corporate", section: "enterprise" },
    { label: "About me", section: "about" },
  ],
  [
    { label: "Terms & Conditions", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
];

const SOCIALS = [
  { label: "Instagram", icon: "/icons/Instagram.svg", href: "#" },
  { label: "YouTube", icon: "/icons/YouTube.svg", href: "#" },
  { label: "LinkedIn", icon: "/icons/LinkedIn.svg", href: "#" },
];

export default function Footer() {
  const { scrollToSection } = useScrollContext();

  return (
    <footer className={styles.footer}>
      <WordmarkStrip width="100%" height={110} className={styles.strip} />

      <div className={styles.inner}>
        {/* Contact icons */}
        <div className={styles.contact}>
          {/* Placeholder number — swap for the real one. */}
          <PhoneCopy number="+41 21 555 01 23" />
          <a href={CONTACT_MAILTO} className={styles.contactIcon} aria-label="Email us">
            <img src="/icons/Email.svg" alt="" />
          </a>
        </div>

        {/* Link columns */}
        <nav className={styles.columns} aria-label="Footer">
          {COLUMNS.map((col, i) => (
            <ul className={styles.col} key={i}>
              {col.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className={styles.link}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.link}
                      onClick={() => scrollToSection(item.section!)}
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </nav>

        {/* Social icons */}
        <div className={styles.socials}>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              className={styles.social}
              aria-label={s.label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={s.icon} alt="" />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} YUAN GONG FU. ALL RIGHTS RESERVED. DESIGNED BY{" "}
          <span className={styles.designer}>STARDUSTCONCEPT</span>
        </p>
      </div>

      {/* Logo icon + full-width wordmark — original brand area, left unchanged */}
      <div className={styles.logoArea}>
        <img
          src="/images/logo-icon.jpg"
          alt="Yuan Gong Fu logo"
          className={styles.logoIcon}
        />
        <p className={styles.wordmark} aria-label="YUANGONGFU">
          YUANGONGFU
        </p>
      </div>
    </footer>
  );
}
