import InfiniteScrollViewport from "@/components/InfiniteScrollViewport";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Intro from "@/components/Intro";
import Practice from "@/components/Practice";
import Enterprise from "@/components/Enterprise";
import Band from "@/components/Band";
import Philosophy from "@/components/Philosophy";
import About from "@/components/About";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <InfiniteScrollViewport overlay={<Navbar />}>
      <main style={{ paddingTop: "var(--nav-height)" }}>
        <Hero />
        <Intro />
        <Practice />
        <Enterprise />
        <Band />
        <Philosophy />
        <About />
        <Testimonials />
        <Footer />
      </main>
    </InfiniteScrollViewport>
  );
}
