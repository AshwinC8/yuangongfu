import styles from "./Testimonials.module.css";

const QUOTES = [
  {
    name: "Nina",
    text: "Being able to train with Tugdual is a great enrichment for me as a person and as a dancer. Practice heals and strengthens at the same time. Through our intensive training and conversations, I have gained a deeper understanding of myself and my movements as a dancer. I am grateful for all of Tugdual's excellent coaching and mental and physical support. Our work has been invaluable to my development and growth as a dancer.",
  },
  {
    name: "François",
    text: "I'm happy to have persevered in this approach to martial arts. It leads to the discovery of my body structure through enriching and challenging exercises and training methods.",
  },
  {
    name: "Maria-Elena",
    text: "This period of turbulence leads us to serious questioning, who am I, where am I going, what am I doing, am I on my path, what meaning can I give to my life and so on... In this whirlwind of questions, it is good to feel supported, guided and accompanied. This unusual approach, which is nonetheless very ancient, requires us to dive deep within ourselves, to visit our dark sides, to free ourselves from them, to awaken our consciences to something greater than ourselves. Throughout this long journey of introspection, extraordinary people were put on my path — and TUG was one of them.",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.testimonials} aria-label="Testimonials">
      <div className={styles.inner}>
        <p className={styles.label}>testimonials</p>
        <div className={styles.grid}>
          {QUOTES.map((q) => (
            <figure key={q.name} className={styles.card}>
              <blockquote className={styles.quote}>
                <p>{q.text}</p>
              </blockquote>
              <figcaption className={styles.name}>{q.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
