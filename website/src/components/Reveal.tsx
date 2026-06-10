import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/**
 * Reveal fades and lifts its children into view the first time they scroll near
 * the viewport.
 *
 * It is the single scroll-entrance primitive used across the sections; staggered
 * lists pass an increasing `delay` to cascade siblings. The animation fires once
 * (`viewport.once`) so scrolling back up does not replay it, and the `-80px`
 * margin starts it slightly before the element is fully on screen. Honors the
 * user's reduced-motion preference through framer-motion's global config.
 *
 * - `delay` is in seconds and offsets the start of the entrance.
 * - `y` is the initial downward offset in pixels that animates to 0.
 */
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
