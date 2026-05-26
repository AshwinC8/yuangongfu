import Image from "next/image";
import styles from "./Hero.module.css";

// All four panels are the SAME source photo in the design, each cropped to
// fill its panel (Figma FILL, centered). Swap this path to change the image.
const HERO_IMG = "/images/hero.jpg";

export default function Hero() {
  return (
    <section className={styles.hero} aria-label="Intro">
      <div className={styles.inner}>
        <div className={styles.panels}>
          {[0, 1, 2, 3].map((i) => (
            <div className={styles.panel} key={i}>
              <Image src={HERO_IMG} alt="" fill style={{ objectFit: "cover" }} priority={i === 0} />
            </div>
          ))}
        </div>

        <div className={styles.copy}>
          <h1 className={styles.heading}>
            POWER BEGINS
            <br />
            IN STILLNESS
          </h1>
          <p className={styles.body}>
            Ancient wisdom embodied in the modern world.
            <br />
            Step onto a path that quiets the mind,
            <br />
            harmonizes the body, and
            <br />
            reveals the self.
          </p>
          <a href="#book" className={styles.cta}>
            book your free consultation
          </a>
        </div>
      </div>
    </section>
  );
}
