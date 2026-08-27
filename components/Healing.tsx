"use client";

import { useScrollContext } from "@/lib/scroll-context";
import LoopDelayVideo from "./LoopDelayVideo";
import styles from "./Healing.module.css";

const BODY = [
  "From an early age, we are conditioned to think, feel, and act in ways that gradually become our identity. These unconscious patterns shape our relationships, decisions, and the way we experience life.",
  "Alongside the internal martial arts, I guide individuals in recognizing and releasing this conditioning, allowing them to reconnect with greater clarity, freedom, and their authentic nature.",
  "This work is deeply personal and not suited to everyone. Let’s begin with a conversation to explore whether it is the right path for you.",
];

export default function Healing() {
  const { scrollToSection } = useScrollContext();

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

          <button
            type="button"
            className={styles.cta}
            onClick={() => scrollToSection("contact")}
          >
            book your free consultation
          </button>
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
