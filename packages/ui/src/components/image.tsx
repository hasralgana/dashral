"use client"

import * as React from "react"
import { ImageOffIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"
import { Spinner } from "./spinner"

type ImageProps = Omit<React.ComponentProps<"img">, "src" | "alt" | "children"> & {
  src: string
  /** Describes the picture; "" for one that's only decoration. */
  alt: string
  /**
   * A fixed shape, width over height (16 / 9, 1): the box keeps it and the picture fills it. Without it (and without
   * fill) the picture takes its own shape, as an img does.
   */
  ratio?: number
  /** The picture fills a box you size yourself with className ("size-10", "h-40 w-full"). */
  fill?: boolean
  /** In a fixed box: "cover" fills it and crops what doesn't fit, "contain" shows the whole picture inside it. */
  fit?: "cover" | "contain"
  /** In place of the picture when it can't be loaded; a quiet broken-picture mark by default. */
  fallback?: React.ReactNode
  /**
   * Your image component (Next.js Image) in place of img; it gets src, alt, className and the rest. In a fixed box
   * (ratio or fill) it gets `fill` instead of width and height, as Next.js Image wants; for its own shape, pass width
   * and height.
   */
  imageAs?: React.ElementType
  classNames?: { image?: string }
}

/**
 * A picture that never pops in, in one tag: `<Image src={photo} alt="The valley at dawn" ratio={16 / 9} />`. While
 * it's on its way its box breathes softly; once it has loaded it fades in. Give it another src and it answers at
 * once: a spinner comes over the picture still showing, and the new one fades in over it the moment it's there (one
 * the browser already has fades in straight away). A picture that can't be loaded leaves a quiet mark, never a
 * broken icon. className sizes and rounds the box; classNames.image styles the picture (a hover zoom,
 * `group-hover:scale-105`, glides with no transition of your own); the img's own props (srcSet, sizes, loading,
 * onLoad) pass through.
 */
function Image({
  src,
  alt,
  ratio,
  fill = false,
  fit = "cover",
  fallback,
  imageAs: Img = "img",
  width,
  height,
  className,
  classNames,
  style,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const { t } = useLocale()
  // The picture on show, which stays until the one asked for has loaded and faded in over it.
  const [shown, setShown] = React.useState(src)
  const [loaded, setLoaded] = React.useState<Record<string, true>>({})
  const [failed, setFailed] = React.useState<Record<string, true>>({})
  const coming = shown !== src
  const there = Boolean(loaded[shown])
  const broken = Boolean(failed[shown]) && !coming
  const waiting = coming && !loaded[src]
  // A fixed box (a ratio, or one you size) holds the picture; else the picture takes its own shape.
  const boxed = fill || ratio !== undefined
  const known = typeof width === "number" && typeof height === "number" && height > 0 ? width / height : undefined
  // An image component of your own (Next.js Image) fills a fixed box with its fill prop, not width and height; a plain
  // img has no such attribute, and gets width and height as given.
  const size = Img !== "img" && boxed ? { fill: true } : { width, height }

  function arrived(source: string) {
    setLoaded((all) => (all[source] ? all : { ...all, [source]: true }))
    // No fade to wait for: the new picture is the one on show at once.
    if (source !== shown && reducedMotion()) setShown(source)
  }

  function gone(source: string) {
    setFailed((all) => (all[source] ? all : { ...all, [source]: true }))
    if (source !== shown) setShown(source)
  }

  return (
    <span
      data-slot="image"
      data-state={broken ? "error" : there && !waiting ? "loaded" : "loading"}
      role={broken ? "img" : undefined}
      aria-label={broken && alt ? alt : undefined}
      className={cn("relative block overflow-hidden", (!there || broken) && "bg-muted", className)}
      // Its own shape isn't known until it loads: the box holds a place meanwhile (the picture's, from width and
      // height, when they're given), so the page doesn't jump more than it must.
      style={{ aspectRatio: boxed ? ratio : there && !known ? undefined : (known ?? 3 / 2), ...style }}
    >
      {!there && !broken && <span aria-hidden className="absolute inset-0 bg-foreground/8 motion-safe:animate-pulse" />}
      {broken ? (
        <span aria-hidden className="absolute inset-0 grid place-items-center text-muted-foreground/70 [&_svg:not([class*='size-'])]:size-[min(1.5rem,45%)]">
          {fallback ?? <ImageOffIcon />}
        </span>
      ) : (
        (coming ? [shown, src] : [shown]).map((source) => {
          const current = source === shown
          const ready = Boolean(loaded[source])
          return (
            <Img
              key={source}
              ref={(node: HTMLImageElement | null) => {
                // It may have loaded, or failed, before React was listening (a cached picture, a server-rendered page).
                if (!node?.complete) return
                if (node.naturalWidth > 0) arrived(source)
                else gone(source)
              }}
              src={source}
              alt={source === src ? alt : ""}
              {...size}
              draggable={false}
              {...props}
              onLoad={(event: React.SyntheticEvent<HTMLImageElement>) => {
                arrived(source)
                if (source === src) onLoad?.(event)
              }}
              // A picture that won't load takes its turn all the same, so the box never waits forever.
              onError={(event: React.SyntheticEvent<HTMLImageElement>) => {
                gone(source)
                if (source === src) onError?.(event)
              }}
              onAnimationEnd={() => {
                if (!current) setShown(source)
              }}
              className={cn(
                // The one on show fills a fixed box, or stands in the page at its own shape; the one coming lies over it.
                boxed || !current ? "absolute inset-0 size-full" : "block h-auto w-full",
                (boxed || !current) && (fit === "contain" ? "object-contain" : "object-cover"),
                current
                  ? [
                      // The fade, and any move you give it (a hover zoom through classNames.image) glides the same way.
                      "transition-[opacity,transform,translate,scale,rotate] duration-(--duration-considered) ease-standard motion-reduce:transition-none",
                      !ready && "opacity-0",
                    ]
                  : ready
                    ? "animate-in duration-(--duration-standard) ease-enter fade-in-0"
                    : "opacity-0",
                classNames?.image
              )}
            />
          )
        })
      )}
      {waiting && (
        <span className="absolute inset-0 grid animate-in place-items-center bg-black/25 duration-(--duration-fast) fade-in-0 motion-reduce:animate-none">
          <span className="grid size-[min(2.5rem,60%)] place-items-center rounded-full bg-black/45 backdrop-blur-sm">
            <Spinner size="sm" label={t("loading")} className="size-[min(1rem,60%)] text-white/85" />
          </span>
        </span>
      )}
    </span>
  )
}

export { Image, type ImageProps }
