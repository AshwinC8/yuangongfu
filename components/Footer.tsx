"use client";

import Image from "next/image";
import { useScrollContext } from "@/lib/scroll-context";
import { CONTACT_EMAIL, CLASS_BOOKING_URL } from "@/lib/links";
import WordmarkStrip from "./WordmarkStrip";
import CopyContact from "./CopyContact";
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
  { label: "Instagram", icon: "/icons/Instagram.svg", href: "https://www.instagram.com/yuangongfu" },
  { label: "YouTube", icon: "/icons/YouTube.svg", href: "https://www.youtube.com" },
  // LinkedIn URL TBD — placeholder until supplied.
  { label: "LinkedIn", icon: "/icons/LinkedIn.svg", href: "#" },
  { label: "Facebook", icon: "/icons/Facebook.svg", href: "https://www.facebook.com/p/YUAN-Gong-Fu-100072486010751/" },
];

export default function Footer() {
  const { scrollToSection } = useScrollContext();

  return (
    <footer data-section="contact" className={styles.footer}>
      <WordmarkStrip width="100%" height={110} className={styles.strip} />

      <div className={styles.inner}>
        {/* Contact icons — click to copy, value shown in a popup above the icon */}
        <div className={styles.contact}>
          <CopyContact
            icon="/icons/Phone.svg"
            value="+41 79 857 00 16"
            label="phone number"
            href="tel:+41798570016"
          />
          <CopyContact
            icon="/icons/Email.svg"
            value={CONTACT_EMAIL}
            label="email address"
            href={`mailto:${CONTACT_EMAIL}`}
          />
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
              <span
                className={styles.socialIcon}
                style={{ WebkitMaskImage: `url(${s.icon})`, maskImage: `url(${s.icon})` }}
                aria-hidden="true"
              />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} YUAN GONG FU. ALL RIGHTS RESERVED. DESIGNED BY{" "}
          <a
            href="https://stardustconcept.com/"
            className={styles.designer}
            target="_blank"
            rel="noopener noreferrer"
          >
            STARDUSTCONCEPT
          </a>
        </p>
      </div>

      {/* Logo icon + full-width wordmark — original brand area, left unchanged */}
      <div className={styles.logoArea}>
        <Image
          src="/images/logo-icon.jpg"
          alt="Yuan Gong Fu logo"
          width={160}
          height={160}
          className={styles.logoIcon}
        />
        <p className={styles.wordmark} aria-label="YUANGONGFU">
          YUANGONGFU
        </p>
      </div>
    </footer>
  );
}
