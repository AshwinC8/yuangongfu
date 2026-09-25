"use client";

import { useEffect, useState } from "react";
import styles from "./CookieBar.module.css";

const STORAGE_KEY = "cookie-consent";

export default function CookieBar() {
  const [visible, setVisible] = useState(false);

  // Only shows up if no prior choice is stored — checked client-side to avoid
  // an SSR/CSR mismatch flash (localStorage isn't available during render).
  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const choose = (value: "accepted" | "rejected") => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={styles.bar} role="region" aria-label="Cookie notice">
      <p className={styles.text}>
        We use cookies to run this site and, with your consent, to understand
        how it&apos;s used. <a href="#" className={styles.link}>Cookie Policy</a>
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reject}
          onClick={() => choose("rejected")}
        >
          Reject non-essential
        </button>
        <button
          type="button"
          className={styles.accept}
          onClick={() => choose("accepted")}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
