import styles from "./Footer.module.css";
import WordmarkStrip from "./WordmarkStrip";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* 178px wordmark pattern strip — matches Figma footer Mask group */}
      <WordmarkStrip width="100%" height={230} className={styles.strip} />

      {/* Bottom info bar */}
      <div className={styles.bottom}>
        <p className={styles.tagline}>
          Power begins in stillness.&nbsp; Strength is the fruit of presence.
        </p>
        <nav className={styles.nav} aria-label="Footer">
          <a href="#book">Book a consultation</a>
          <a href="mailto:contact@yuangongfu.com">Contact</a>
        </nav>
        <p className={styles.copy}>
          &copy; {new Date().getFullYear()} Yuan Gong Fu. All rights reserved.
        </p>
      </div>

      {/* Logo icon + full-width wordmark */}
      <div className={styles.logoArea}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
