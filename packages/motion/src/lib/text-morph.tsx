"use client"

// Text that morphs into its next state letter by letter: the letters both have glide to their new places, the new ones
// rise in out of a soft blur, and the ones it no longer has fade away ("Follow" to "Following" keeps "Follow" where it
// is and grows "ing"). The motion Button uses it for a label that's only text; use it for any short text that changes.

import * as React from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "./reduced"
import { duration, ease, spring } from "./tokens"

/** The letters, each keyed by itself and how many of it came before ("l-0", "l-1"), so a shared letter is the same one. */
function lettersOf(text: string) {
  const seen = new Map<string, number>()
  return [...text].map((char) => {
    const n = seen.get(char) ?? 0
    seen.set(char, n + 1)
    return { char, key: `${char}-${n}` }
  })
}

/**
 * A short text that morphs into the next one letter by letter. Screen readers hear the text as a whole; the letters
 * are only for the eye. With reduced motion the new text fades in.
 */
export function TextMorph({ children, className }: { children: string; className?: string }) {
  const reduced = useReducedMotion()
  const group = React.useId()
  return (
    <span className={cn("relative inline-flex whitespace-pre", className)}>
      <span className="sr-only">{children}</span>
      <LayoutGroup id={group}>
        {/* popLayout lifts a leaving letter out of the line at once, so the others glide to their places straight away. */}
        <AnimatePresence mode="popLayout" initial={false}>
          {lettersOf(children).map(({ char, key }) => (
            <motion.span
              key={key}
              aria-hidden
              className="inline-block"
              layout={reduced ? false : "position"}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: "0.3em", filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: "-0.3em", filter: "blur(3px)", transition: { duration: duration.fast, ease: ease.exit } }}
              transition={{ layout: spring.glide, default: { duration: duration.standard, ease: ease.enter } }}
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </span>
  )
}
