import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  once?: boolean;
};

/** IntersectionObserver reveal — runs only when visible; one-shot by default. */
export function Reveal({
  children,
  className,
  delayMs = 0,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: visible ? `${delayMs}ms` : undefined }}
    >
      {children}
    </div>
  );
}

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  /** Max translate in px at scroll extremes */
  intensity?: number;
};

/**
 * Lightweight parallax via rAF-throttled scroll.
 * Caps work to one style write per frame; disables when offscreen or reduced-motion.
 */
export function Parallax({
  children,
  className,
  intensity = 40,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        active.current = Boolean(entry?.isIntersecting);
        if (!active.current) {
          node.style.transform = "translate3d(0,0,0)";
        }
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(node);

    const onScroll = () => {
      if (!active.current || frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0;
        const rect = node.getBoundingClientRect();
        const viewH = window.innerHeight || 1;
        const progress = (rect.top + rect.height / 2) / viewH - 0.5;
        const y = Math.max(-intensity, Math.min(intensity, -progress * intensity));
        node.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [intensity]);

  return (
    <div ref={ref} className={cn("parallax-slow", className)}>
      {children}
    </div>
  );
}

export function PageShell({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("page-enter", className)} style={style}>
      {children}
    </div>
  );
}
