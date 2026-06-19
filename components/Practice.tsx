"use client";

import { useState } from "react";
import LoopDelayVideo from "./LoopDelayVideo";
import styles from "./Practice.module.css";

const ITEMS = [
  {
    title: "Meditation",
    body: "The foundation of everything. We begin by sitting. We breathe. We notice. Meditation teaches us to observe the flow of thought without being carried away by it. This stillness becomes the ground on which transformation grows.",
  },
  {
    title: "Qi Gong",
    body: "The energy begins to move. In simple, graceful motions, we bring awareness into the body. We connect breath, posture, and intention — releasing tension, realigning the nervous system, and awakening a sense of quiet strength.",
  },
  {
    title: "Taijiquan",
    body: "The dance of opposites. Yin and yang in motion. Taijiquan brings mindfulness into more complex movements and shifting directions. It strengthens coordination, balance, and emotional regulation — all while staying rooted in the meditative state.",
  },
  {
    title: "Xing Yi Quan",
    body: "Form and intent become one. This explosive, internal art mirrors nature’s forces— five elements, ten animals—and develops a relaxed power known as Fa Li. Here, movement becomes expression. Intention becomes clarity.",
  },
  {
    title: "Sanda",
    body: "Stillness under pressure. Sanda is the practical, combat-ready application of internal principles. Through strikes, projections, and movement, we challenge ourselves to remain centered even in chaos — training the body to meet life as it comes.",
  },
];

export default function Practice() {
  const [open, setOpen] = useState<number>(0);

  return (
    <section data-section="practice" className={styles.practice} aria-label="The Practice">
      <div className={styles.inner}>
        <div className={styles.imageCol}>
          <LoopDelayVideo
            className={styles.image}
            src="/videos/practice.mp4"
            aria-label="Practice"
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
                  onClick={() => setOpen(open === i ? -1 : i)}
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
