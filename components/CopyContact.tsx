"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import styles from "./Footer.module.css";

type Props = {
  /** Icon shown in the button. */
  icon: string;
  /** The value copied to the clipboard and shown in the popup. */
  value: string;
  /** Accessible label, e.g. "phone number" or "email address". */
  label: string;
};

// Icon button that copies `value` on click. A small popup sits above it —
// showing the value on hover/focus, and "Copied!" briefly after a click —
// instead of the value being on display all the time.
export default function CopyContact({ icon, value, label }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — popup still shows the value to copy manually */
    }
  };

  return (
    <span className={styles.copyWrap}>
      <button
        type="button"
        className={styles.contactIcon}
        aria-label={`Copy ${label} ${value}`}
        onClick={copy}
      >
        <img src={icon} alt="" />
      </button>
      <span className={styles.copyPopup} role="status" aria-live="polite">
        {copied ? "Copied!" : value}
      </span>
    </span>
  );
}
