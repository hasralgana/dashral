"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl"
type PerView = number | Partial<Record<Breakpoint, number>>

type CarouselProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** The slides, in order. */
  items: React.ReactNode[]
  /** Slides in view at once, or per screen size from the smallest up: { base: 1, sm: 2, lg: 3 }. */
  perView?: PerView
  /** Space between slides, in pixels. */
  gap?: number
  /** The first slide in view (from 0), controlled. */
  index?: number
  /** The first slide in view at the start, uncontrolled. */
  defaultIndex?: number
  /** Called when another slide comes first, by any means: arrows, dots, swiping, the keyboard or autoplay. */
  onIndexChange?: (index: number) => void
  /** From the end, Next goes back to the start (and Previous the other way). */
  loop?: boolean
  /**
   * Moves on by itself every this many milliseconds, back to the start at the end. It pauses while the pointer is
   * over it or focus is inside, and has a Pause button. With reduced motion it starts paused.
   */
  autoplay?: number
  /** The arrows: over the slides' edges (on wider screens), in a row under them, or none — swiping still works. */
  controls?: "overlay" | "below" | "none"
  /** Under the slides: a dot per position, "2 / 5", or nothing. */
  indicator?: "dots" | "count" | "none"
  /** Names it for screen readers, e.g. "Featured products". */
  label?: string
  classNames?: { viewport?: string; slide?: string; controls?: string; arrow?: string }
}

const breakpoints: Breakpoint[] = ["base", "sm", "md", "lg", "xl"]

/** --pv-<breakpoint> for each size, each falling back to the one below, so the classes below can pick theirs. */
function perViewVars(perView: PerView): React.CSSProperties {
  const counts = typeof perView === "number" ? { base: perView } : perView
  let last = counts.base ?? 1
  return Object.fromEntries(
    breakpoints.map((bp) => {
      last = counts[bp] ?? last
      return [`--pv-${bp}`, last]
    })
  ) as React.CSSProperties
}


/**
 * Slides in a row that you swipe, drag or step through, in one tag: arrows, dots (or "2 / 5"), the keyboard, looping
 * and autoplay. Built on native scroll snapping, so touch and trackpads feel like the platform's, and a mouse can drag
 * it too; several slides can show at once, a different number per screen size. Right to left, the order and the arrows
 * mirror.
 */
function Carousel({
  items,
  perView = 1,
  gap = 16,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  autoplay,
  controls = "overlay",
  indicator = "dots",
  label,
  className,
  classNames,
  style,
  ...props
}: CarouselProps) {
  const { t, locale } = useLocale()
  const number = new Intl.NumberFormat(locale)
  const viewport = React.useRef<HTMLDivElement>(null)
  const [current, setCurrent] = React.useState(indexProp ?? defaultIndex)
  // The last position the first slide can take (5 slides, 2 in view: 3), measured.
  const [last, setLast] = React.useState(Math.max(0, items.length - 1))
  const [playing, setPlaying] = React.useState(false)
  const [held, setHeld] = React.useState({ hover: false, focus: false })
  const reported = React.useRef(current)
  const total = items.length

  const slides = () => [...(viewport.current?.children ?? [])] as HTMLElement[]

  const scrollTo = React.useCallback((to: number, instant = false) => {
    const node = viewport.current
    const target = node?.children[to] as HTMLElement | undefined
    if (!node || !target) return
    const rtl = getComputedStyle(node).direction === "rtl"
    const box = node.getBoundingClientRect()
    const slide = target.getBoundingClientRect()
    node.scrollBy({ left: rtl ? slide.right - box.right : slide.left - box.left, behavior: instant || reducedMotion() ? "auto" : "smooth" })
  }, [])

  // Where the row is: the slide nearest the start, and how far it can go. Again whenever it scrolls or resizes.
  React.useEffect(() => {
    const node = viewport.current
    if (!node) return
    let frame = 0
    const measure = () => {
      const [first, second] = slides()
      if (!first) return
      const stride = second ? Math.abs(second.offsetLeft - first.offsetLeft) : first.offsetWidth
      if (!stride) return
      const visible = Math.max(1, Math.round((node.clientWidth + gap) / stride))
      const end = Math.max(0, total - visible)
      // At the very end the last slides can't reach the start, so count that as the last position.
      const atEnd = Math.abs(node.scrollLeft) + node.clientWidth >= node.scrollWidth - 2
      const at = atEnd ? end : Math.min(end, Math.round(Math.abs(node.scrollLeft) / stride))
      setLast(end)
      setCurrent(at)
      if (at !== reported.current) {
        reported.current = at
        onIndexChange?.(at)
      }
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    node.addEventListener("scroll", onScroll, { passive: true })
    const resize = new ResizeObserver(onScroll)
    resize.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      node.removeEventListener("scroll", onScroll)
      resize.disconnect()
    }
    // onIndexChange is read when it fires; a new function each render shouldn't rebuild the observers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gap, total])

  // Start where asked, without the slide-in.
  React.useLayoutEffect(() => {
    if (defaultIndex || indexProp) scrollTo(indexProp ?? defaultIndex, true)
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Controlled: follow the index you pass.
  React.useEffect(() => {
    if (indexProp !== undefined && indexProp !== reported.current) scrollTo(indexProp)
  }, [indexProp, scrollTo])

  const go = React.useCallback(
    (to: number, wrap = loop) => {
      const next = to > last ? (wrap ? 0 : last) : to < 0 ? (wrap ? last : 0) : to
      scrollTo(next)
    },
    [last, loop, scrollTo]
  )

  // Autoplay: on unless motion is reduced; it waits while you're pointing at it or working in it, or the tab is hidden.
  React.useEffect(() => {
    if (autoplay) setPlaying(!reducedMotion())
  }, [autoplay])
  React.useEffect(() => {
    if (!autoplay || !playing || held.hover || held.focus) return
    const timer = window.setTimeout(() => {
      if (!document.hidden) go(current + 1, true)
    }, autoplay)
    return () => window.clearTimeout(timer)
  }, [autoplay, playing, held, current, go])

  // Dragging with a mouse (touch and trackpads scroll natively). While you drag, snapping is off so the row follows
  // the pointer; on release it settles on the next or previous slide if you dragged far enough, else back.
  const drag = React.useRef<{ x: number; scroll: number; moved: boolean; id: number } | null>(null)
  const [dragging, setDragging] = React.useState(false)

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    drag.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false, id: event.pointerId }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    const dx = event.clientX - state.x
    if (!state.moved) {
      if (Math.abs(dx) < 5) return
      // Past a few pixels it's a drag, not a click: take the pointer and let the row follow it.
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    event.currentTarget.scrollLeft = state.scroll - dx
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state || state.id !== event.pointerId) return
    drag.current = null
    if (!state.moved) return
    const node = event.currentTarget
    if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId)
    const dx = event.clientX - state.x
    const rtl = getComputedStyle(node).direction === "rtl"
    const [first, second] = [...node.children] as HTMLElement[]
    const stride = first && second ? Math.abs(second.offsetLeft - first.offsetLeft) : node.clientWidth
    // Where the row stopped, in slides (1.4 = past the second slide). Dragged far enough, it moves on to the next
    // slide in the direction you dragged; a short drag goes back to the nearest one.
    const position = Math.abs(node.scrollLeft) / stride
    const forward = rtl ? dx > 0 : dx < 0
    const far = Math.abs(dx) > Math.min(80, stride / 4)
    const to = far ? (forward ? Math.ceil(position - 0.05) : Math.floor(position + 0.05)) : Math.round(position)
    go(Math.max(0, Math.min(last, to)), false)
    // Snapping comes back once the row has settled, so it doesn't jump mid-glide.
    const done = () => setDragging(false)
    node.addEventListener("scrollend", done, { once: true })
    window.setTimeout(done, 700)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key]
    if (step) {
      event.preventDefault()
      go(current + step)
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      scrollTo(event.key === "Home" ? 0 : last)
    }
  }

  const canPrev = loop || current > 0
  const canNext = loop || current < last
  const arrowClass = cn(
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full border bg-background/85 text-foreground shadow-xs backdrop-blur-sm transition-[opacity,background-color] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:size-4 [&_svg]:rtl:-scale-x-100",
    // Over the slides a disabled arrow steps out of the way; in the row under them it stays, dimmed, so the pair keeps its place.
    controls === "overlay" ? "disabled:opacity-0" : "disabled:opacity-40",
    classNames?.arrow
  )
  const prev = (
    <button type="button" className={arrowClass} aria-label={t("previousSlide")} disabled={!canPrev} onClick={() => go(current - 1)}>
      <ChevronLeftIcon aria-hidden />
    </button>
  )
  const next = (
    <button type="button" className={arrowClass} aria-label={t("nextSlide")} disabled={!canNext} onClick={() => go(current + 1)}>
      <ChevronRightIcon aria-hidden />
    </button>
  )
  const showRow = indicator !== "none" || controls === "below" || !!autoplay

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label ?? t("carousel")}
      data-slot="carousel"
      className={cn("relative w-full min-w-0", className)}
      style={{ ...perViewVars(perView), "--gap": `${gap}px`, ...style } as React.CSSProperties}
      onPointerEnter={() => setHeld((h) => ({ ...h, hover: true }))}
      onPointerLeave={() => setHeld((h) => ({ ...h, hover: false }))}
      onFocus={() => setHeld((h) => ({ ...h, focus: true }))}
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setHeld((h) => ({ ...h, focus: false }))}
      {...props}
    >
      <div className="relative">
        <div
          ref={viewport}
          data-slot="carousel-viewport"
          tabIndex={0}
          // Announce the slide that comes in, except while it moves by itself.
          aria-live={playing && !held.hover && !held.focus ? "off" : "polite"}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // After a drag, the click that ends it mustn't open a link or press a button in the slide.
          onClickCapture={(event) => {
            if (dragging) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          onDragStart={(event) => event.preventDefault()}
          data-dragging={dragging || undefined}
          className={cn(
            "flex snap-x snap-mandatory gap-(--gap) overflow-x-auto overscroll-x-contain rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden",
            "cursor-grab data-dragging:cursor-grabbing data-dragging:snap-none data-dragging:select-none",
            "[--per-view:var(--pv-base)] sm:[--per-view:var(--pv-sm)] md:[--per-view:var(--pv-md)] lg:[--per-view:var(--pv-lg)] xl:[--per-view:var(--pv-xl)]",
            classNames?.viewport
          )}
        >
          {items.map((item, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slideOf", { index: number.format(i + 1), total: number.format(total) })}
              data-slot="carousel-slide"
              data-active={i === current || undefined}
              className={cn("min-w-0 shrink-0 grow-0 basis-[calc((100%_-_var(--gap)_*_(var(--per-view)_-_1))_/_var(--per-view))] snap-start", classNames?.slide)}
            >
              {item}
            </div>
          ))}
        </div>
        {controls === "overlay" && (
          <>
            <div className="absolute inset-y-0 start-3 hidden items-center sm:flex">{prev}</div>
            <div className="absolute inset-y-0 end-3 hidden items-center sm:flex">{next}</div>
          </>
        )}
      </div>

      {showRow && (
        <div data-slot="carousel-controls" className={cn("mt-4 flex items-center gap-3", controls === "below" ? "justify-between" : "justify-center", classNames?.controls)}>
          <div className="flex items-center gap-3">
            {autoplay ? (
              <button
                type="button"
                className={cn(arrowClass, "size-8")}
                aria-label={playing ? t("pauseSlides") : t("playSlides")}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
              </button>
            ) : null}
            {indicator === "dots" && (
              <div className="flex items-center gap-1.5">
                {Array.from({ length: last + 1 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={t("goToSlide", { index: number.format(i + 1) })}
                    aria-current={i === current || undefined}
                    onClick={() => scrollTo(i)}
                    className="group grid h-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <span
                      className={cn(
                        "block h-1.5 rounded-full transition-[width,background-color] duration-(--duration-standard) ease-spring motion-reduce:transition-none",
                        i === current ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40"
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
            {indicator === "count" && (
              <p aria-hidden className="text-sm text-muted-foreground tabular-nums">
                <span className="font-medium text-foreground">{number.format(current + 1)}</span> / {number.format(last + 1)}
              </p>
            )}
          </div>
          {controls === "below" && (
            <div className="flex items-center gap-2">
              {prev}
              {next}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export { Carousel, type CarouselProps }
