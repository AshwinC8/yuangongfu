"use client";

import { useState } from "react";
import CrossfadeVideo from "./CrossfadeVideo";
import LoopDelayVideo from "./LoopDelayVideo";
import styles from "./Practice.module.css";

type PracticeItem = {
  title: string;
  body: string[];
  video: string;
  // First frame of the clip, shown in the tablet/mobile in-panel video.
  poster: string;
  // Native width/height of the clip; the frame resizes to it (no crop, no bars).
  ratio: string;
};

const ITEMS: PracticeItem[] = [
  {
    title: "Meditation",
    body: [
      "The foundation of everything. We begin by sitting. We breathe. We notice. Meditation teaches us to observe the flow of thought without being carried away by it. This stillness becomes the ground on which transformation grows.",
    ],
    video: "/videos/practice-meditation.mp4?v=2",
    poster: "/images/posters/practice.jpg",
    ratio: "16 / 9",
  },
  {
    title: "Qi Gong",
    body: [
      "The energy begins to move. In simple, graceful motions, we bring awareness into the body. We connect breath, posture, and intention — releasing tension, realigning the nervous system, and awakening a sense of quiet strength.",
    ],
    video: "/videos/practice-qigong.mp4",
    poster: "/images/posters/practice-qigong.jpg",
    ratio: "728 / 576",
  },
  {
    title: "Taijiquan",
    body: [
      "The dance of opposites. Yin and yang in motion. Taijiquan brings mindfulness into more complex movements and shifting directions. It strengthens coordination, balance, and emotional regulation — all while staying rooted in the meditative state.",
    ],
    video: "/videos/practice-taijiquan.mp4",
    poster: "/images/posters/practice-taijiquan.jpg",
    ratio: "1104 / 968",
  },
  {
    title: "Xing Yi Quan",
    body: [
      "Form and intent become one. This explosive, internal art mirrors nature’s forces— five elements, ten animals—and develops a relaxed power known as Fa Li. Here, movement becomes expression. Intention becomes clarity.",
    ],
    video: "/videos/practice-xingyiquan.mp4",
    poster: "/images/posters/practice-xingyiquan.jpg",
    ratio: "16 / 9",
  },
  {
    title: "Sanda",
    body: [
      "Stillness under pressure. Sanda is the practical, combat-ready application of internal principles. Through strikes, projections, and movement, we challenge ourselves to remain centered even in chaos — training the body to meet life as it comes.",
    ],
    video: "/videos/practice-sanda.mp4",
    poster: "/images/posters/practice-sanda.jpg",
    ratio: "16 / 9",
  },
  {
    title: "Healing",
    body: [
      "From an early age, we are conditioned to think, feel, and act in ways that gradually become our identity. These unconscious patterns shape our relationships, decisions, and the way we experience life.",
      "Alongside the internal martial arts, I guide individuals in recognizing and releasing this conditioning, allowing them to reconnect with greater clarity, freedom, and their authentic nature.",
      "This work is deeply personal and not suited to everyone. Let’s begin with a conversation to explore whether it is the right path for you.",
    ],
    video: "/videos/healing.mp4",
    poster: "/images/posters/healing.jpg",
    ratio: "928 / 720",
  },
];

// Meditation stays the default-open item (the side stage's poster is its first frame).
const DEFAULT_OPEN = ITEMS.findIndex((item) => item.title === "Meditation");

export default function Practice() {
  const [open, setOpen] = useState<number>(DEFAULT_OPEN);
  // Accordion can be fully closed (open === -1); keep showing the last
  // active item's clip rather than falling back to a section-wide default.
  const [activeVideo, setActiveVideo] = useState<number>(DEFAULT_OPEN);

  return (
    <section data-section="practice" className={styles.practice} aria-label="The Practice">
      <div className={styles.inner}>
        <div className={styles.imageCol}>
          <div
            className={styles.frame}
            style={{ "--ratio": ITEMS[activeVideo].ratio } as React.CSSProperties}
          >
            <CrossfadeVideo
              className={styles.image}
              src={ITEMS[activeVideo].video}
              poster="/images/posters/practice.jpg"
              aria-label={ITEMS[activeVideo].title}
            />
          </div>
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
                    {/* Tablet/mobile: the clip sits in the open panel, right under
                        the tapped title (desktop uses the side column instead). */}
                    <div
                      className={styles.panelMedia}
                      style={{ "--ratio": item.ratio } as React.CSSProperties}
                    >
                      <LoopDelayVideo
                        className={styles.image}
                        src={item.video}
                        // Closed items skip the poster: browsers fetch it eagerly,
                        // even on desktop where this copy of the clip is hidden.
                        poster={open === i ? item.poster : undefined}
                        active={open === i}
                        aria-label={item.title}
                      />
                    </div>
                    <div className={styles.panelText}>
                      {item.body.map((para, j) => (
                        <p key={j} className={styles.body}>
                          {para}
                        </p>
                      ))}
                    </div>
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
