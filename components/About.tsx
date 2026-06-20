import styles from "./About.module.css";
import LoopDelayVideo from "./LoopDelayVideo";
import WordmarkStrip from "./WordmarkStrip";

const SECTIONS = [
  {
    label: "About me",
    body: "I came to martial arts to understand the whole, the yin and the yang, the spiritual, healing and fighting aspects of it. My first Shaolin teacher always said that a monk was a sage, a healer and a warrior, this how the search began. \n\nInternal martial arts taught me to feel deeply without being ruled by emotion, to move with awareness instead of reaction. What I share now comes not from belief, but from lived experience.\n\nThis isn’t a place to learn how to fight. It’s a space to remember who you are."
  },
  {
    label: "About Yuan Gong Fu",
    body: "A practice rooted in the internal martial arts of gong fu and tai chi, designed not for performance or spectacle, but for deep self-inquiry, emotional healing, and sustainable transformation.\n\nThis is not a gym or a dojo. It’s a path.\nOne walked with awareness, discipline, and love."
  },
  {
    label: "Our Mission",
    body: "To guide individuals — especially those in positions of power — toward lasting inner transformation by cultivating presence, emotional sovereignty, and the joy that arises from genuine connection to the self.\n\nThrough the embodied wisdom of internal martial arts, we awaken a higher way of being, grounded in truth, love, and daily commitment.",
  },
  {
    label: "Our Vision",
    body: "A world in which more people live and lead from their authentic self, with clarity, peace, and open-hearted strength. Where power is no longer measured by dominance or wealth, but by the ability to remain centered — calm in the storm, joyful without reason, and compassionate even in conflict.",
  },
];

export default function About() {
  return (
    <section data-section="about" className={styles.about} aria-label="About">
      <div className={styles.inner}>
        <div className={styles.textCol}>
          {SECTIONS.map((s) => (
            <div key={s.label} className={styles.block}>
              <h3 className={styles.label}>{s.label}</h3>
              {s.body.split("\n\n").map((para, i) => (
                <p key={i} className={styles.body}>
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.imageCol}>
          <LoopDelayVideo
            src="/videos/about%20me.mp4"
            poster="/images/posters/about.jpg"
            className={styles.image}
            aria-label="About Yuan Gong Fu"
          />
        </div>

        <WordmarkStrip className={styles.accent} />

      </div>
    </section>
  );
}
