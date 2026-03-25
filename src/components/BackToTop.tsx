"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-10 right-10 z-[60] flex h-12 w-12 items-center justify-center rounded-full 
        border border-[var(--border)] bg-[var(--bg-card)]/80 text-[var(--text)] shadow-2xl backdrop-blur-md 
        transition-all duration-300 hover:bg-[var(--accent)] hover:text-white hover:scale-110 active:scale-95
        ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-50 pointer-events-none"}
      `}
      title="Back to Top"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
}
