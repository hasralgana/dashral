"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon, XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"
import { Spinner } from "./spinner"

type LightboxImage = {
  src: string
  /** Describes the picture; also the thumbnail's name. Required for anything that isn't decoration. */
  alt: string
  /** A smaller file for the thumbnail; src without one. */
  thumbnail?: string
  /** Under the picture in the viewer. */
  caption?: React.ReactNode
  width?: number
  height?: number
}

type LightboxProps = Omit<React.ComponentProps<"div">, "children"> & {
  images: LightboxImage[]
  /**
   * "grid" (the default): a grid of thumbnails, each opening the viewer. "gallery": one large cover with a strip of
   * thumbnails under it, as a product's photos are shown; a thumbnail shows its picture in the cover, and the cover
   * opens the viewer.
   */
  layout?: "grid" | "gallery"
  /** The thumbnails' columns: from the sm breakpoint up in a grid (two on phones; 3 by default), always in a gallery's strip (4 by default). */
  columns?: 2 | 3 | 4 | 5
  /** The thumbnails' shape, and a gallery's cover: width over height. */
  ratio?: number
  /** false: no grid; open it yourself with open, onOpenChange and index (e.g. from a carousel or a single cover). */
  thumbnails?: boolean
  /** Whether the viewer is open, controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** The picture in the viewer, controlled (from 0). */
  index?: number
  onIndexChange?: (index: number) => void
  /** Your image component (Next.js Image) for the thumbnails and the viewer; it gets src, alt, width, height, className. */
  imageAs?: React.ElementType
  classNames?: { grid?: string; thumbnail?: string; cover?: string; viewer?: string; image?: string; caption?: string }
}

const columnClasses = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" }

const navButton =
  "grid size-10 place-items-center rounded-full bg-white/10 text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-5"

/**
 * A grid of pictures that opens each one large, in one tag: `<Lightbox images={photos} />`. In the viewer the arrow
 * keys and the buttons move between them (in reading order, so the other way in Arabic), a swipe does on a phone, and
 * Escape closes it, back to the thumbnail it came from. `layout="gallery"` shows them as a product's photos: one
 * large cover and a strip of thumbnails under it. A picture that's still on its way says so (a breathing tile, a
 * small spinner) and fades in when it's there; nothing pops in.
 */
function Lightbox({
  images,
  layout = "grid",
  columns: columnsProp,
  ratio = 4 / 3,
  thumbnails = true,
  open: openProp,
  onOpenChange,
  index: indexProp,
  onIndexChange,
  imageAs: Image = "img",
  className,
  classNames,
  ...props
}: LightboxProps) {
  const { t, dir } = useLocale()
  const portalContainer = usePortalContainer()
  const [openState, setOpenState] = React.useState(false)
  const [indexState, setIndexState] = React.useState(0)
  const open = openProp ?? openState
  const count = images.length
  const index = Math.min(Math.max(indexProp ?? indexState, 0), Math.max(count - 1, 0))
  const image = images[index]
  const swipe = React.useRef<{ x: number; y: number } | null>(null)

  function setOpen(next: boolean) {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }
  function go(next: number) {
    if (count === 0) return
    const wrapped = (next + count) % count
    if (indexProp === undefined) setIndexState(wrapped)
    onIndexChange?.(wrapped)
  }
  // Physical arrows, mapped to reading order: → is "next" left to right, "previous" right to left.
  const forward = dir === "rtl" ? -1 : 1
  const columns = columnsProp ?? (layout === "gallery" ? 4 : 3)

  return (
    <>
      {thumbnails && layout === "gallery" && image && (
        <div data-slot="lightbox" className={cn("grid gap-2", className)} {...props}>
          <button
            type="button"
            aria-label={t("viewImage", { name: image.alt })}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
            className={cn(
              "group/cover relative overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              classNames?.cover
            )}
            style={{ aspectRatio: ratio }}
          >
            <Cover images={images} index={index} Image={Image} />
            <span
              aria-hidden
              className="absolute end-2 bottom-2 grid size-8 place-items-center rounded-md bg-black/50 text-white opacity-0 transition-opacity duration-(--duration-fast) group-hover/cover:opacity-100 group-focus-visible/cover:opacity-100"
            >
              <ExpandIcon className="size-4" />
            </span>
          </button>
          {count > 1 && (
            <div className={cn("grid gap-2", classNames?.grid)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {images.map((entry, i) => (
                <button
                  key={entry.src + i}
                  type="button"
                  aria-label={entry.alt}
                  aria-current={i === index ? "true" : undefined}
                  onClick={() => go(i)}
                  className={cn(
                    "group/thumb relative overflow-hidden rounded-md bg-muted outline-none transition-opacity duration-(--duration-fast) focus-visible:ring-2 focus-visible:ring-ring/50",
                    i === index ? "ring-2 ring-primary" : "opacity-60 hover:opacity-100",
                    classNames?.thumbnail
                  )}
                  style={{ aspectRatio: ratio }}
                >
                  <Thumbnail Image={Image} src={entry.thumbnail ?? entry.src} width={entry.width} height={entry.height} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {thumbnails && layout === "grid" && (
        <div
          data-slot="lightbox"
          className={cn("grid grid-cols-2 gap-2", columnClasses[columns], className, classNames?.grid)}
          {...props}
        >
          {images.map((entry, i) => (
            <button
              key={entry.src + i}
              type="button"
              aria-label={t("viewImage", { name: entry.alt })}
              aria-haspopup="dialog"
              onClick={() => {
                go(i)
                setOpen(true)
              }}
              className={cn(
                "group/thumb relative overflow-hidden rounded-md bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                classNames?.thumbnail
              )}
              style={{ aspectRatio: ratio }}
            >
              <Thumbnail Image={Image} src={entry.thumbnail ?? entry.src} width={entry.width} height={entry.height} />
            </button>
          ))}
        </div>
      )}
      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal container={portalContainer}>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-(--duration-fast) data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-(--duration-standard)" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") go(index + forward)
              else if (event.key === "ArrowLeft") go(index - forward)
              else if (event.key === "Home") go(0)
              else if (event.key === "End") go(count - 1)
              else return
              event.preventDefault()
            }}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") swipe.current = { x: event.clientX, y: event.clientY }
            }}
            onPointerUp={(event) => {
              const start = swipe.current
              swipe.current = null
              if (!start) return
              const dx = event.clientX - start.x
              // A sideways swipe of 50px or more, more across than down. Swiping toward the start shows the next one.
              if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(event.clientY - start.y)) return
              go(index + (dx < 0 ? forward : -forward))
            }}
            className={cn(
              "fixed inset-0 z-50 flex touch-pan-y flex-col text-white outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-(--duration-standard) data-[state=open]:ease-spring data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-(--duration-fast)",
              classNames?.viewer
            )}
          >
            <DialogPrimitive.Title className="sr-only">{image?.alt ?? t("imageViewer")}</DialogPrimitive.Title>
            <div className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
              <span className="text-sm text-white/70 tabular-nums" aria-live="polite">
                {count > 1 ? t("imageOf", { index: index + 1, total: count }) : ""}
              </span>
              <DialogPrimitive.Close aria-label={t("close")} className={navButton}>
                <XIcon aria-hidden />
              </DialogPrimitive.Close>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
              {image && <Stage images={images} index={index} Image={Image} className={classNames?.image} />}
              {count > 1 && (
                <>
                  <button type="button" aria-label={t("previousImage")} onClick={() => go(index - 1)} className={cn(navButton, "absolute start-3 top-1/2 -translate-y-1/2 max-sm:hidden")}>
                    <ChevronLeftIcon aria-hidden className="rtl:-scale-x-100" />
                  </button>
                  <button type="button" aria-label={t("nextImage")} onClick={() => go(index + 1)} className={cn(navButton, "absolute end-3 top-1/2 -translate-y-1/2 max-sm:hidden")}>
                    <ChevronRightIcon aria-hidden className="rtl:-scale-x-100" />
                  </button>
                </>
              )}
            </div>
            <div className="flex min-h-14 shrink-0 items-center justify-center gap-3 px-4 py-3">
              {count > 1 && (
                <button type="button" aria-label={t("previousImage")} onClick={() => go(index - 1)} className={cn(navButton, "sm:hidden")}>
                  <ChevronLeftIcon aria-hidden className="rtl:-scale-x-100" />
                </button>
              )}
              <div
                key={index}
                className={cn(
                  "min-w-0 flex-1 animate-in text-center text-sm text-pretty text-white/80 duration-(--duration-considered) ease-standard fade-in-0 motion-reduce:animate-none sm:flex-none",
                  classNames?.caption
                )}
              >
                {image?.caption}
              </div>
              {count > 1 && (
                <button type="button" aria-label={t("nextImage")} onClick={() => go(index + 1)} className={cn(navButton, "sm:hidden")}>
                  <ChevronRightIcon aria-hidden className="rtl:-scale-x-100" />
                </button>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  )
}

/**
 * A thumbnail in its tile. While the picture is on its way the tile breathes softly, so it reads as loading rather
 * than empty; once it's there the picture fades in over it, never popping in.
 */
function Thumbnail({ Image, src, width, height }: { Image: React.ElementType; src: string; width?: number; height?: number }) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <>
      {!loaded && <span aria-hidden className="absolute inset-0 bg-foreground/8 motion-safe:animate-pulse" />}
      <Image
        ref={(node: HTMLImageElement | null) => {
          // Already in the cache: it may have loaded before React was listening.
          if (node?.complete && node.naturalWidth > 0) setLoaded(true)
        }}
        src={src}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        // A picture that won't load: the tile stops breathing, and stays a plain tile.
        onError={() => setLoaded(true)}
        className={cn(
          "relative size-full object-cover transition-[opacity,transform] duration-(--duration-considered) ease-standard motion-safe:group-hover/thumb:scale-105 motion-reduce:transition-none",
          !loaded && "opacity-0"
        )}
      />
    </>
  )
}

/**
 * A gallery's cover: the picture a thumbnail picked. Picking another answers at once: if its picture isn't there yet
 * a spinner comes over the one showing, and the new one fades in over it the moment it has loaded (one already
 * fetched fades in straight away). The first picture arrives the way a thumbnail does: the tile breathes, then it
 * fades in.
 */
function Cover({ images, index, Image }: { images: LightboxImage[]; index: number; Image: React.ElementType }) {
  const { t } = useLocale()
  // The picture on show, which stays until the one picked has loaded and faded in over it.
  const [shownState, setShown] = React.useState(index)
  const shown = Math.min(shownState, images.length - 1)
  const [loaded, setLoaded] = React.useState<Record<string, true>>({})
  const coming = shown !== index
  const waiting = coming && !loaded[images[index]!.src]

  function arrived(i: number) {
    setLoaded((all) => (all[images[i]!.src] ? all : { ...all, [images[i]!.src]: true }))
    // No fade to wait for: the new picture is the one on show at once.
    if (i !== shown && reducedMotion()) setShown(i)
  }

  return (
    <>
      {!coming && !loaded[images[shown]!.src] && <span aria-hidden className="absolute inset-0 bg-foreground/8 motion-safe:animate-pulse" />}
      {(coming ? [shown, index] : [shown]).map((i) => {
        const entry = images[i]!
        const there = Boolean(loaded[entry.src])
        return (
          <Image
            key={entry.src + i}
            ref={(node: HTMLImageElement | null) => {
              // Already in the cache: it may have loaded before React was listening.
              if (node?.complete && node.naturalWidth > 0) arrived(i)
            }}
            src={entry.src}
            alt=""
            width={entry.width}
            height={entry.height}
            draggable={false}
            onLoad={() => arrived(i)}
            // A picture that won't load takes its turn all the same, so the cover never waits forever.
            onError={() => {
              arrived(i)
              if (i !== shown) setShown(i)
            }}
            onAnimationEnd={() => {
              if (i !== shown) setShown(i)
            }}
            className={cn(
              "absolute inset-0 size-full object-cover",
              i === shown
                ? ["transition-opacity duration-(--duration-considered) ease-standard motion-reduce:transition-none", !there && "opacity-0"]
                : there
                  ? "animate-in duration-(--duration-standard) ease-enter fade-in-0"
                  : "opacity-0"
            )}
          />
        )
      })}
      {waiting && (
        <span className="absolute inset-0 grid animate-in place-items-center bg-black/25 duration-(--duration-fast) fade-in-0 motion-reduce:animate-none">
          <span className="grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
            <Spinner size="sm" label={t("loading")} className="text-white/85" />
          </span>
        </span>
      )}
    </>
  )
}

type StageState = {
  /** The picture to show, and the one it replaces (kept on screen until the new one has loaded). */
  index: number
  previous: number | null
  /** 1 moving to the next picture, -1 to the previous: where the new one comes from. */
  step: 1 | -1
  /** Counts the changes, so each one gets fresh elements (and fresh animations). */
  turn: number
  loaded: boolean
}

const cell = "col-start-1 row-start-1 max-h-full max-w-full rounded-sm object-contain select-none"
const roll = "duration-(--duration-considered) ease-standard motion-reduce:animate-none"

/**
 * The viewer's picture. Moving to another, the one on screen stays until the new one has loaded, then the two cross:
 * the old one fades out toward the side it's left behind on, the new one fades in from the side it comes from (logical
 * sides, so it reverses in Arabic). Never a blank frame, and no picture popping in after its fade. The neighbours are
 * fetched ahead, so moving on is usually instant; when one does take a moment, a small spinner says so (after a
 * beat, so a quick picture never flashes it), over the picture still showing or on the dark when it's the first.
 */
function Stage({
  images,
  index,
  Image,
  className,
}: {
  images: LightboxImage[]
  index: number
  Image: React.ElementType
  className?: string
}) {
  const { t } = useLocale()
  const count = images.length
  const [state, setState] = React.useState<StageState>({ index, previous: null, step: 1, turn: 0, loaded: false })
  if (state.index !== index) {
    const delta = (index - state.index + count) % count
    const step = delta === 1 ? 1 : delta === count - 1 ? -1 : index > state.index ? 1 : -1
    // Pressed again before the last one loaded: the picture still on screen stays the one to leave.
    setState({ index, previous: state.loaded ? state.index : state.previous, step, turn: state.turn + 1, loaded: false })
  }
  const { previous, step, turn, loaded } = state
  const current = images[state.index]!
  const leaving = previous === null ? undefined : images[previous]

  const markLoaded = React.useCallback(
    () => setState((s) => (s.turn === turn && !s.loaded ? { ...s, loaded: true } : s)),
    [turn]
  )

  React.useEffect(() => {
    if (Image !== "img" || count < 2) return
    for (const i of [state.index + 1, state.index - 1]) {
      const preload = new window.Image()
      preload.src = images[(i + count) % count]!.src
    }
  }, [Image, images, count, state.index])

  return (
    <div className="grid size-full min-h-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center">
      {leaving && (
        <Image
          key={`out-${turn}`}
          src={leaving.src}
          alt=""
          aria-hidden
          width={leaving.width}
          height={leaving.height}
          draggable={false}
          className={cn(
            cell,
            loaded && ["animate-out fade-out-0 fill-mode-forwards motion-reduce:hidden", step > 0 ? "slide-out-to-start-8" : "slide-out-to-end-8", roll],
            className
          )}
        />
      )}
      <Image
        key={`in-${turn}`}
        ref={(node: HTMLImageElement | null) => {
          // Already in the cache: it may have loaded before React was listening.
          if (node?.complete && node.naturalWidth > 0) markLoaded()
        }}
        src={current.src}
        alt={current.alt}
        width={current.width}
        height={current.height}
        draggable={false}
        onLoad={markLoaded}
        onError={markLoaded}
        className={cn(
          cell,
          !loaded ? "opacity-0" : ["animate-in fade-in-0", turn > 0 && (step > 0 ? "slide-in-from-end-8" : "slide-in-from-start-8"), roll],
          className
        )}
      />
      {!loaded && (
        <span
          key={`wait-${turn}`}
          className="pointer-events-none z-10 col-start-1 row-start-1 grid size-10 animate-in place-items-center rounded-full bg-black/45 backdrop-blur-sm delay-200 duration-(--duration-standard) fill-mode-both fade-in-0 motion-reduce:animate-none"
        >
          <Spinner size="sm" label={t("loading")} className="text-white/85" />
        </span>
      )}
    </div>
  )
}

export { Lightbox, type LightboxProps, type LightboxImage }
