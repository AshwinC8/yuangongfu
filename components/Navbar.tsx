"use client";

import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <a href="#" className={styles.brand} aria-label="Yuan Gong Fu home">
          YUANGONGFU
        </a>

        {/* Right cluster — matches Figma: 2 grey blocks + book now */}
        <div className={styles.actions}>
          {/* These two are EMPTY grey placeholders in the design.
              Drop real nav links / search / language selector in here. */}
          <button type="button" className={styles.pill} aria-label="Menu item 1" />
          <button type="button" className={styles.pill} aria-label="Menu item 2" />

          <a href="#book" className={styles.cta}>
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
        <div className={styles.mobilePill} />
        <div className={styles.mobilePill} />
        <a href="#book" className={styles.mobileCta} onClick={() => setMenuOpen(false)}>
          book now
        </a>
      </div>
    </header>
  );
}
