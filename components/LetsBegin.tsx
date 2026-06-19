import { CONTACT_MAILTO, CLASS_BOOKING_URL } from "@/lib/links";
import styles from "./LetsBegin.module.css";

// TEMP section — sits between Philosophy and About. Built from the "Group 46"
// design mock; swap content / remove once the final section is ready.
export default function LetsBegin() {
  return (
    <section data-section="begin" className={styles.section} aria-label="Let's Begin">
      <div className={styles.inner}>
        <h2 className={styles.heading}>LET&rsquo;S BEGIN</h2>

        <div className={styles.columns}>
          <div className={styles.col}>
            <div className={styles.copy}>
              <p className={styles.label}>Join the class</p>
              <p className={styles.body}>
                Train in a small group setting at the prestigious{" "}
                <strong>Beau&ndash;Rivage Palace</strong> in Lausanne, set on the
                shores of Lake Geneva. Classes combine traditional martial arts
                training with a focus on discipline, movement, and personal
                development.
              </p>
              <p className={styles.schedule}>
                Monday: 18:00&ndash;20:00
                <br />
                Saturday: 17:00&ndash;18:30
              </p>
            </div>
            <a
              href={CLASS_BOOKING_URL}
              className={styles.cta}
              target="_blank"
              rel="noopener noreferrer"
            >
              book now
            </a>
          </div>

          <div className={styles.col}>
            <div className={styles.copy}>
              <p className={styles.label}>Book a private session</p>
              <p className={styles.body}>
                Receive personalized instruction tailored to your goals, whether
                your focus is martial arts, movement, self&ndash;development, or
                deeper aspects of the practice. Sessions are adapted to your
                individual experience and needs.
              </p>
            </div>
            <a href={CONTACT_MAILTO} className={styles.cta}>
              contact me
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
