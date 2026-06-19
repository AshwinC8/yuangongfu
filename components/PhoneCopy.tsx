"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import styles from "./Footer.module.css";

// Phone icon that copies the number on click. A small popup sits above it —
// showing the number on hover/focus, and "Copied!" briefly after a click —
// instead of the number being on display all the time.
export default function PhoneCopy({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — popup still shows the number to copy manually */
    }
  };

  return (
    <span className={styles.phoneWrap}>
      <button
        type="button"
        className={styles.contactIcon}
        aria-label={`Copy phone number ${number}`}
        onClick={copy}
      >
        <img src="/icons/Phone.svg" alt="" />
      </button>
      <span className={styles.phonePopup} role="status" aria-live="polite">
        {copied ? "Copied!" : number}
      </span>
    </span>
  );
}
