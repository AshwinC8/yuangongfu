"use client";

import { useEffect, useState } from "react";
import { useScrollContext } from "@/lib/scroll-context";
import { CLASS_BOOKING_URL } from "@/lib/links";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { id: "practice", label: "practice" },
  { id: "enterprise", label: "enterprise" },
  { id: "philosophy", label: "philosophy" },
  { id: "about", label: "about" },
  { id: "testimonials", label: "testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollToSection } = useScrollContext();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.brand}
          aria-label="Yuan Gong Fu home"
          onClick={() => scrollToSection("home")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/header%20yuangongfu.svg" alt="YUANGONGFU" />
        </button>

        {/* Right cluster — matches Figma: 2 grey blocks + book now */}
        <div className={styles.actions}>
          <nav className={styles.navLinks}>
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className={styles.navLink}
                onClick={() => scrollToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <a
            href={CLASS_BOOKING_URL}
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            book now
          </a>
        </div>

        {/* Mobile toggle (no mobile design supplied) */}
        <button
          type="button"
          className={`${styles.toggle} ${menuOpen ? styles.toggleOpen : ""}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`${styles.mobilePanel} ${
          menuOpen ? styles.mobilePanelOpen : ""
        }`}
      >
        <nav className={styles.mobileNav}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={styles.mobileNavLink}
              onClick={() => {
                scrollToSection(link.id);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <a
          href={CLASS_BOOKING_URL}
          className={styles.mobileCta}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMenuOpen(false)}
        >
          book now
        </a>
      </div>
    </header>
  );
}
