"use client";

import { useState } from "react";
import CrossfadeVideo from "./CrossfadeVideo";
import styles from "./Practice.module.css";

const ITEMS = [
  {
    title: "Meditation",
    body: "The foundation of everything. We begin by sitting. We breathe. We notice. Meditation teaches us to observe the flow of thought without being carried away by it. This stillness becomes the ground on which transformation grows.",
    video: "/videos/practice-meditation.mp4",
  },
  {
    title: "Qi Gong",
    body: "The energy begins to move. In simple, graceful motions, we bring awareness into the body. We connect breath, posture, and intention — releasing tension, realigning the nervous system, and awakening a sense of quiet strength.",
    video: "/videos/practice-qigong.mp4",
  },
  {
    title: "Taijiquan",
    body: "The dance of opposites. Yin and yang in motion. Taijiquan brings mindfulness into more complex movements and shifting directions. It strengthens coordination, balance, and emotional regulation — all while staying rooted in the meditative state.",
    video: "/videos/practice-taijiquan.mp4",
  },
  {
    title: "Xing Yi Quan",
    body: "Form and intent become one. This explosive, internal art mirrors nature’s forces— five elements, ten animals—and develops a relaxed power known as Fa Li. Here, movement becomes expression. Intention becomes clarity.",
    video: "/videos/practice-xingyiquan.mp4",
  },
  {
    title: "Sanda",
    body: "Stillness under pressure. Sanda is the practical, combat-ready application of internal principles. Through strikes, projections, and movement, we challenge ourselves to remain centered even in chaos — training the body to meet life as it comes.",
    video: "/videos/practice-sanda.mp4",
  },
];

export default function Practice() {
  const [open, setOpen] = useState<number>(0);
  // Accordion can be fully closed (open === -1); keep showing the last
  // active item's clip rather than falling back to a section-wide default.
  const [activeVideo, setActiveVideo] = useState<number>(0);

  return (
    <section data-section="practice" className={styles.practice} aria-label="The Practice">
      <div className={styles.inner}>
        <div className={styles.imageCol}>
          <CrossfadeVideo
            className={styles.image}
            src={ITEMS[activeVideo].video}
            poster="/images/posters/practice.jpg"
            aria-label={ITEMS[activeVideo].title}
          />
        </div>

        <div className={styles.contentCol}>
          <p className={styles.label}>The Practice</p>

          <ul className={styles.accordion} role="list">
            {ITEMS.map((item, i) => (
              <li key={item.title} className={styles.item}>
                <button
                  className={styles.trigger}
                  aria-expanded={open === i}
                  onClick={() => {
                    setOpen(open === i ? -1 : i);
                    setActiveVideo(i);
                  }}
                >
                  <span>{item.title}</span>
                  <span className={styles.icon} aria-hidden="true">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                <div className={`${styles.panel} ${open === i ? styles.panelOpen : ""}`}>
                  <div className={styles.panelInner}>
                    <p className={styles.body}>{item.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
