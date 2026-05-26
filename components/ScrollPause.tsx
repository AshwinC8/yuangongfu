"use client";
import { useEffect } from "react";

// Adds class "scrolling" to <body> while the user is scrolling.
// Removed 200 ms after the last scroll event — CSS uses it to pause animations.
export default function ScrollPause() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function onScroll() {
      document.body.classList.add("scrolling");
      clearTimeout(timer);
      timer = setTimeout(() => {
        document.body.classList.remove("scrolling");
      }, 500);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      document.body.classList.remove("scrolling");
    };
  }, []);

  return null;
}
