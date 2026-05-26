import Image from "next/image";
import styles from "./Band.module.css";
import WordmarkStrip from "./WordmarkStrip";

export default function Band() {
  return (
    <div className={styles.wrapper}>
      {/* Thin full-width wordmark strip (35px) — appears before the image in Figma */}
      <WordmarkStrip width="100%" height={35} className={styles.thinStrip} />

      <div className={styles.imageStrip}>
        <Image src="/images/band.jpg" alt="" fill style={{ objectFit: "cover" }} className={styles.img} />
      </div>
    </div>
  );
}
