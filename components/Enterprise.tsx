import styles from "./Enterprise.module.css";
import LoopDelayVideo from "./LoopDelayVideo";
import WordmarkStrip from "./WordmarkStrip";
import { CLASS_BOOKING_URL } from "@/lib/links";

export default function Enterprise() {
  return (
    <section data-section="enterprise" className={styles.enterprise} aria-label="For your Enterprise">
      <div className={styles.inner}>
        <div className={styles.contentCol}>
          <p className={styles.label}>For your Enterprise</p>
          <h2 className={styles.heading}>
            Corporate &amp; Workplace
            <br />
            Resilience begins within.
          </h2>
          <div className={styles.body}>
            <p>
              In high-stakes environments, performance depends on presence.
              Through tailored workshops and regular classes, we offer your team
              practical tools to cultivate focus, emotional regulation, and inner
              resilience.
            </p>
            <p className={styles.listIntro}>A single session can:</p>
            <ul>
              <li>Relax the nervous system</li>
              <li>Re-center attention</li>
              <li>Improve emotional clarity</li>
              <li>Shift stress into calm</li>
            </ul>
            <p className={styles.listIntro}>With regular practice, expect:</p>
            <ul>
              <li>Improved posture and joint health</li>
              <li>Better breathing and energy levels</li>
              <li>Greater adaptability under pressure</li>
              <li>Stronger immunity and mental balance</li>
            </ul>
            <p>
              Whether for team-building, leadership development, or long-term
              wellness strategy, these practices are a powerful addition to your
              workplace.
            </p>
          </div>
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
            src="/videos/corporate.mp4"
            poster="/images/posters/corporate.jpg"
            aria-label="Enterprise wellness"
          />
        </div>

        <WordmarkStrip className={styles.accent} />
      </div>
    </section>
  );
}
