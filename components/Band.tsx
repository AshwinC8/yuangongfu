import styles from "./Band.module.css";
import LoopDelayVideo from "./LoopDelayVideo";
import WordmarkStrip from "./WordmarkStrip";

export default function Band() {
  return (
    <div className={styles.wrapper}>
      {/* Thin full-width wordmark strip (35px) — appears before the image in Figma */}
      <WordmarkStrip width="100%" height={35} className={styles.thinStrip} />

      <div className={styles.imageStrip}>
        <LoopDelayVideo
          src="/videos/philosphy.mp4"
          poster="/images/posters/philosphy.jpg"
          className={styles.img}
        />
      </div>
    </div>
  );
}
