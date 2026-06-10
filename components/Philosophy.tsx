import styles from "./Philosophy.module.css";

export default function Philosophy() {
  return (
    <section className={styles.philosophy} aria-label="The Philosophy">
      <div className={styles.inner}>
        <p className={styles.label}>The Philosophy</p>
        <div className={styles.contentCol}>
          <blockquote className={styles.quote}>
            These teachings are not meant to be mastered.
            <br />
            They are meant to be lived.
          </blockquote>
          <p className={styles.body}>
            Our tradition is rooted in the mountains of Wudang and guided by ten
            ancestral principles and five pillars. But we don&rsquo;t follow
            blindly. We evolve. From classical lineage to modern applications like
            Sanda and MMA, we search for the common thread: awareness, balance,
            and the path back to ourselves.
            <br />
            <br />
            We begin in silence. We move with awareness. We return to
            stillness — changed.
          </p>
        </div>
      </div>
    </section>
  );
}
