"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Footer.module.css";

type Props = {
  /** Icon shown in the button. */
  icon: string;
  /** The value copied to the clipboard and shown in the popup. */
  value: string;
  /** Accessible label, e.g. "phone number" or "email address". */
  label: string;
  /**
   * Optional link target (e.g. `mailto:`/`tel:`). When set the icon renders as
   * a real link: clicking copies `value` AND triggers the default action, so
   * the mail/phone app opens too.
   */
  href?: string;
};

// Icon that copies `value` on click. A small popup sits above it — showing the
// value on hover/focus, and "Copied!" briefly after a click — instead of the
// value being on display all the time. With `href`, it also fires the link
// (e.g. opens the mail client) on the same click.
export default function CopyContact({ icon, value, label, href }: Props) {
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

  const glyph = (
    <span
      className={styles.contactGlyph}
      style={{ WebkitMaskImage: `url(${icon})`, maskImage: `url(${icon})` }}
      aria-hidden="true"
    />
  );

  return (
    <span className={styles.copyWrap}>
      {href ? (
        <a
          href={href}
          className={styles.contactIcon}
          aria-label={`Copy ${label} ${value} and open`}
          onClick={copy}
        >
          {glyph}
        </a>
      ) : (
        <button
          type="button"
          className={styles.contactIcon}
          aria-label={`Copy ${label} ${value}`}
          onClick={copy}
        >
          {glyph}
        </button>
      )}
      <span className={styles.copyPopup} role="status" aria-live="polite">
        {copied ? "Copied!" : value}
      </span>
    </span>
  );
}
