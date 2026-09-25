"use client";

import { CLASS_BOOKING_URL } from "@/lib/links";
import LoopDelayVideo from "./LoopDelayVideo";
import styles from "./Healing.module.css";

const BODY = [
  "From an early age, we are conditioned to think, feel, and act in ways that gradually become our identity. These unconscious patterns shape our relationships, decisions, and the way we experience life.",
  "Alongside the internal martial arts, I guide individuals in recognizing and releasing this conditioning, allowing them to reconnect with greater clarity, freedom, and their authentic nature.",
  "This work is deeply personal and not suited to everyone. Let’s begin with a conversation to explore whether it is the right path for you.",
];

export default function Healing() {
  return (
    <section data-section="healing" className={styles.healing} aria-label="Healing">
      <div className={styles.inner}>
        <div className={styles.contentCol}>
          <p className={styles.label}>The Healing</p>

          {BODY.map((para, i) => (
            <p key={i} className={styles.body}>
              {para}
            </p>
          ))}

          <a
            href={CLASS_BOOKING_URL}
            className={styles.cta}
            target="_blank"
            rel="noopener noreferrer"
          >
            book your free consultation
          </a>
        </div>

        <div className={styles.imageCol}>
          <LoopDelayVideo
            className={styles.image}
            src="/videos/healing.mp4"
            poster="/images/posters/healing.jpg"
            aria-label="Healing"
          />
        </div>
      </div>
    </section>
  );
}
