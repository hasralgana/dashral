"use client"

import * as React from "react"

import { cn } from "../lib/utils"

type TextRevealVariant = "blur" | "rise" | "fade" | "wipe"

type TextRevealProps = Omit<React.HTMLAttributes<HTMLElement>, "children"> & {
  /** Plain text: it's split into words, and each arrives a moment after the one before. */
  children: string
  /** The element it renders: a heading, a paragraph or inline text. */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
  /**
   * How the words arrive: un-blurring as they rise (blur), sliding up from behind a line (rise), fading in (fade), or
   * the whole text wiped in from the start of the line (wipe).
   */
  variant?: TextRevealVariant
  /** When it plays: the first time it scrolls into view, or as soon as it's on the page. */
  trigger?: "view" | "mount"
  /** Milliseconds before the first word, e.g. to follow a heading that reveals first. */
  delay?: number
  /** Milliseconds between one word and the next. */
  stagger?: number
  classNames?: { word?: string }
}

// The hidden state, only while scripts run and motion is welcome: without either, the words are simply there. It's
// keyed on the root's data-reveal, so the server's HTML is already hidden and nothing flashes before it plays. Written
// out in full so Tailwind finds every class.
const hiddenWord: Record<Exclude<TextRevealVariant, "wipe">, string> = {
  blur: "[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:opacity-0 [@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:blur-[10px] [@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:translate-y-[0.35em]",
  rise: "[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:translate-y-[110%]",
  fade: "[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:opacity-0",
}
const hiddenWipe = "[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:[clip-path:inset(0_100%_0_0)] rtl:[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/reveal:[clip-path:inset(0_0_0_100%)]"
const wordMotion: Record<Exclude<TextRevealVariant, "wipe">, string> = {
  blur: "transition-[opacity,filter,translate] duration-(--duration-considered) ease-enter",
  rise: "transition-[translate] duration-[calc(var(--duration-considered)*1.3)] ease-enter",
  fade: "transition-opacity duration-(--duration-considered) ease-enter",
}

/**
 * Text that arrives word by word, in one tag: as it scrolls into view or on load, blurring in, rising from a line,
 * fading in or wiped in. Screen readers and search engines get the whole text; with reduced motion, or before scripts
 * run, it's simply there.
 */
function TextReveal({
  children,
  as: Tag = "p",
  variant = "blur",
  trigger = "view",
  delay = 0,
  stagger = 55,
  className,
  classNames,
  ...props
}: TextRevealProps) {
  const ref = React.useRef<HTMLElement>(null)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    // Settle the hidden state before anything changes it. On a reload with the scripts cached, hydration can land
    // before the first paint; if the browser never computed the hidden styles, the switch to shown has nothing to
    // transition from and the words just appear. Reading layout forces that style pass.
    void node.getBoundingClientRect()
    if (trigger === "mount") {
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      { rootMargin: "0px 0px -12% 0px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [trigger])

  const words = children.split(/\s+/).filter(Boolean)
  const root = cn("group/reveal", className)

  if (variant === "wipe") {
    return (
      <Tag ref={ref as React.Ref<never>} data-slot="text-reveal" data-reveal={shown ? "shown" : "pending"} className={root} {...props}>
        <span
          className={cn(
            "inline-block [clip-path:inset(0_0_0_0)] transition-[clip-path] duration-[calc(var(--duration-considered)*2)] ease-enter motion-reduce:transition-none",
            hiddenWipe
          )}
          style={{ transitionDelay: `${delay}ms` }}
        >
          {children}
        </span>
      </Tag>
    )
  }

  return (
    <Tag ref={ref as React.Ref<never>} data-slot="text-reveal" data-reveal={shown ? "shown" : "pending"} className={root} {...props}>
      {/* The spaces sit between the words: inside an inline-block they would collapse. */}
      {words.map((word, i) => {
        const timing = { transitionDelay: `${delay + i * stagger}ms` }
        const motion = cn("inline-block motion-reduce:transition-none", wordMotion[variant], hiddenWord[variant], classNames?.word)
        return (
          <React.Fragment key={i}>
            {variant === "rise" ? (
              // A window as tall as the line (with room for descenders) that the word slides up into.
              <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                <span className={motion} style={timing}>
                  {word}
                </span>
              </span>
            ) : (
              <span className={motion} style={timing}>
                {word}
              </span>
            )}
            {i < words.length - 1 && " "}
          </React.Fragment>
        )
      })}
    </Tag>
  )
}

export { TextReveal, type TextRevealProps }
