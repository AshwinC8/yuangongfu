import styles from "./Intro.module.css";
import WordmarkStrip from "./WordmarkStrip";

export default function Intro() {
  return (
    <section className={styles.intro} aria-label="The practice">
      <div className={styles.inner}>
        <WordmarkStrip width={269} height={534} className={styles.col} />

        <div className={styles.center}>
          <h2 className={styles.heading}>
            Taijiquan.
            <br />
            Qi Gong.
            <br />
            Meditation.
          </h2>
          <p className={styles.body}>
            Rooted in the ancient Wudang tradition and refined through lived
            experience, this practice is not about performance—it&apos;s about
            remembering who you are. Through meditation, Taijiquan, Qi Gong, and
            internal martial arts, we open a space where joy arises from within,
            and presence becomes the truest source of power.
          </p>
        </div>

        <WordmarkStrip width={269} height={534} className={styles.col} />
      </div>
    </section>
  );
}
