"use client"

import * as React from "react"

import { cn } from "../lib/utils"
import { Container, type ContainerProps } from "./container"

type SectionProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** A short line above the title: what the part is about ("Pricing", "Why teams switch"). */
  eyebrow?: React.ReactNode
  /** The part's heading. It names the section for screen readers too. */
  title?: React.ReactNode
  /** A sentence or two under the title. */
  description?: React.ReactNode
  /** Under the description: the part's buttons. */
  actions?: React.ReactNode
  /** The heading's alignment: centred over the content, or at its start. */
  align?: "center" | "start"
  /** The heading's level: h2 (default) for a part of the page, h1 for the first one. */
  titleAs?: "h1" | "h2"
  /** The content's width, as Container's sizes. */
  size?: ContainerProps["size"]
  /** The room above and below: sm (48px, 64px from sm up), default (64px, 96px), lg (96px, 128px). */
  spacing?: "sm" | "default" | "lg"
  /** muted lays a faint band behind it, to set a part apart from its neighbours. */
  tone?: "default" | "muted"
  /** The heading rises into place the first time it scrolls into view. On by default; with reduced motion it's still. */
  reveal?: boolean
  classNames?: { container?: string; header?: string; eyebrow?: string; title?: string; description?: string; actions?: string; content?: string }
}

const spacings = { sm: "py-12 sm:py-16", default: "py-16 sm:py-24", lg: "py-24 sm:py-32" }

// The heading's hidden state, only while scripts run and motion is welcome: without either it's simply there. Keyed on
// the heading's data-reveal, so the server's HTML is already hidden and nothing flashes before it plays.
const hidden =
  "[@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/section:translate-y-3 [@media(scripting:enabled)]:motion-safe:group-data-[reveal=pending]/section:opacity-0"
const arrive = "transition-[opacity,translate] duration-(--duration-considered) ease-enter motion-reduce:transition-none"

/**
 * One part of a landing page, in one tag: `<Section eyebrow="Pricing" title="Simple plans" description="…">…</Section>`.
 * The room above and below, a heading (an eyebrow, the title, a description and buttons) centred or at the start, and
 * the content under it in a Container. The section is named by its title, and the heading rises into place the first
 * time it scrolls into view, a beat between its lines.
 */
function Section({
  eyebrow,
  title,
  description,
  actions,
  align = "center",
  titleAs: Title = "h2",
  size = "lg",
  spacing = "default",
  tone = "default",
  reveal = true,
  id,
  className,
  classNames,
  children,
  ...props
}: SectionProps) {
  const generatedId = React.useId()
  const titleId = `${id ?? generatedId}-title`
  const centered = align === "center"
  const hasHeader = Boolean(eyebrow || title || description || actions)
  const header = React.useRef<HTMLDivElement>(null)
  const [shown, setShown] = React.useState(!reveal)

  React.useEffect(() => {
    const node = header.current
    if (!reveal || !node) return
    // Settle the hidden state first, so the switch to shown has something to transition from.
    void node.getBoundingClientRect()
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
  }, [reveal])

  // Each line of the heading arrives a beat after the one before.
  let line = 0
  const next = () => ({ transitionDelay: `${line++ * 70}ms` })

  return (
    <section
      data-slot="section"
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn(spacings[spacing], tone === "muted" && "bg-muted/50", className)}
      {...props}
    >
      <Container size={size} className={classNames?.container}>
        {hasHeader && (
          <div
            ref={header}
            data-reveal={shown ? "shown" : "pending"}
            className={cn("group/section max-w-2xl", centered && "mx-auto text-center", classNames?.header)}
          >
            {eyebrow && (
              <p className={cn("text-sm font-medium text-primary-text", arrive, hidden, classNames?.eyebrow)} style={next()}>
                {eyebrow}
              </p>
            )}
            {title && (
              <Title
                id={titleId}
                className={cn("text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl", eyebrow && "mt-3", arrive, hidden, classNames?.title)}
                style={next()}
              >
                {title}
              </Title>
            )}
            {description && (
              <p
                className={cn("text-base leading-[1.6] text-pretty text-muted-foreground sm:text-lg", (eyebrow || title) && "mt-4", arrive, hidden, classNames?.description)}
                style={next()}
              >
                {description}
              </p>
            )}
            {actions && (
              <div
                className={cn("flex flex-wrap items-center gap-3", centered && "justify-center", hasHeader && "mt-8", arrive, hidden, classNames?.actions)}
                style={next()}
              >
                {actions}
              </div>
            )}
          </div>
        )}
        {children !== undefined && children !== null && (
          <div data-slot="section-content" className={cn(hasHeader && "mt-12 sm:mt-16", classNames?.content)}>
            {children}
          </div>
        )}
      </Container>
    </section>
  )
}

export { Section, type SectionProps }
