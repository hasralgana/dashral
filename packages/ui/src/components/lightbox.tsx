"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { usePortalContainer } from "../lib/portal"

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
  /** The thumbnails' columns from the sm breakpoint up (two on phones). */
  columns?: 2 | 3 | 4 | 5
  /** The thumbnails' shape: width over height. */
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
  classNames?: { grid?: string; thumbnail?: string; viewer?: string; image?: string; caption?: string }
}

const columnClasses = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" }

const navButton =
  "grid size-10 place-items-center rounded-full bg-white/10 text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-5"

/**
 * A grid of pictures that opens each one large, in one tag: `<Lightbox images={photos} />`. In the viewer the arrow
 * keys and the buttons move between them (in reading order, so the other way in Arabic), a swipe does on a phone, and
 * Escape closes it, back to the thumbnail it came from.
 */
function Lightbox({
  images,
  columns = 3,
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

  return (
    <>
      {thumbnails && (
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
              <Image
                src={entry.thumbnail ?? entry.src}
                alt=""
                width={entry.width}
                height={entry.height}
                loading="lazy"
                className="size-full object-cover transition-transform duration-(--duration-considered) ease-standard motion-safe:group-hover/thumb:scale-105"
              />
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
              {image && (
                <Image
                  // Keyed by the picture, so each new one fades in.
                  key={image.src + index}
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className={cn(
                    "max-h-full max-w-full animate-in rounded-sm object-contain duration-(--duration-standard) ease-enter fade-in-0 select-none motion-reduce:animate-none",
                    classNames?.image
                  )}
                  draggable={false}
                />
              )}
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
              <div className={cn("min-w-0 flex-1 text-center text-sm text-pretty text-white/80 sm:flex-none", classNames?.caption)}>{image?.caption}</div>
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

export { Lightbox, type LightboxProps, type LightboxImage }
