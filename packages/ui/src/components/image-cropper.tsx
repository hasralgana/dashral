"use client"

import * as React from "react"
import { RotateCwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Slider } from "./slider"
import { Spinner } from "./spinner"

/** The part of the picture that's kept, in the picture's own pixels (before it's turned), and how far it's turned. */
type CropArea = { x: number; y: number; width: number; height: number; rotation: number }

type ImageCropperProps = {
  /** The picture: a URL, or URL.createObjectURL(file) for a file someone just picked. */
  src: string
  /** Width ÷ height of the crop: 1 for a square or circle, 16 / 9 for a banner. */
  aspect?: number
  /** The crop's outline. A circle still crops a square; draw it round where you show it. */
  shape?: "rect" | "circle"
  /** Controlled zoom, from minZoom to maxZoom. 1 fills the crop exactly. */
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (zoom: number) => void
  minZoom?: number
  maxZoom?: number
  /** Controlled turn in degrees, a multiple of 90, clockwise. */
  rotation?: number
  defaultRotation?: number
  onRotationChange?: (rotation: number) => void
  /** Called whenever the crop changes, and once the picture has loaded. Pass the area to cropImage. */
  onCropChange?: (area: CropArea) => void
  /** The zoom slider and the rotate button under the picture. */
  showControls?: boolean
  /** "anonymous" for a picture on another site (it must allow it), so cropImage can read it. */
  crossOrigin?: "anonymous" | "use-credentials"
  /** Height of the picture area in pixels; it's as wide as its container. */
  height?: number
  disabled?: boolean
  /** The picture area's name for screen readers. */
  "aria-label"?: string
  className?: string
  classNames?: { viewport?: string; image?: string; frame?: string; controls?: string }
}

type Point = { x: number; y: number }

// Turning by a multiple of 90° in screen space (y points down), exact, with no sin/cos rounding.
function turn({ x, y }: Point, degrees: number): Point {
  switch (((degrees % 360) + 360) % 360) {
    case 90:
      return { x: -y, y: x }
    case 180:
      return { x: -x, y: -y }
    case 270:
      return { x: y, y: -x }
    default:
      return { x, y }
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const sideways = (rotation: number) => (((rotation % 180) + 180) % 180) === 90
// Room around the crop, so the picture outside it shows, dimmed.
const inset = 24

/**
 * A picture to crop before it's uploaded: drag it (or use the arrow keys) to move it under the crop, zoom with the
 * slider, the wheel, a pinch or + and −, and turn it 90° at a time. It never leaves an empty corner in the crop.
 * onCropChange gives the area; cropImage turns it into a file.
 */
function ImageCropper({
  src,
  aspect: aspectProp = 1,
  shape = "rect",
  zoom: zoomProp,
  defaultZoom = 1,
  onZoomChange,
  minZoom = 1,
  maxZoom = 3,
  rotation: rotationProp,
  defaultRotation = 0,
  onRotationChange,
  onCropChange,
  showControls = true,
  crossOrigin,
  height = 288,
  disabled = false,
  "aria-label": ariaLabel,
  className,
  classNames,
}: ImageCropperProps) {
  const { t } = useLocale()
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const instructionsId = React.useId()

  const [zoomState, setZoomState] = React.useState(defaultZoom)
  const [rotationState, setRotationState] = React.useState(defaultRotation)
  const zoom = clamp(zoomProp ?? zoomState, minZoom, maxZoom)
  // Quarter turns only: anything else snaps to the nearest one.
  const rotation = Math.round((rotationProp ?? rotationState) / 90) * 90
  const aspect = Number.isFinite(aspectProp) && aspectProp > 0 ? aspectProp : 1

  // The picture's own size, the picture area's size, and the point of the picture at the crop's centre (in the
  // picture's pixels): kept that way, the crop stays on the same spot when the area resizes or the picture turns.
  const [natural, setNatural] = React.useState<{ width: number; height: number } | null>(null)
  const [failed, setFailed] = React.useState(false)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const [box, setBox] = React.useState({ width: 0, height: 0 })
  const [center, setCenter] = React.useState<Point | null>(null)
  // While a finger or the mouse moves the picture it follows exactly; otherwise zoom and turns glide.
  const [moving, setMoving] = React.useState(false)

  // A new picture starts again, centred and unzoomed.
  const [shownSrc, setShownSrc] = React.useState(src)
  if (shownSrc !== src) {
    setShownSrc(src)
    setNatural(null)
    setFailed(false)
    setCenter(null)
    if (zoomProp === undefined) setZoomState(defaultZoom)
    if (rotationProp === undefined) setRotationState(defaultRotation)
  }

  function loaded(image: HTMLImageElement) {
    if (image.naturalWidth && image.naturalHeight) setNatural({ width: image.naturalWidth, height: image.naturalHeight })
    else setFailed(true)
  }
  // A picture already in the cache can finish loading before React listens for it (when the page is hydrated).
  React.useEffect(() => {
    const image = imageRef.current
    if (image?.complete && !natural) loaded(image)
  }, [src]) // eslint-disable-line react-hooks/exhaustive-deps

  // Placed: loaded and laid out once, at rest. Only then does it fade in and start to glide, so it doesn't sweep in
  // from its own size.
  const [placed, setPlaced] = React.useState(false)
  const ready = Boolean(natural && box.width)
  React.useEffect(() => {
    if (!ready) return setPlaced(false)
    const frameId = requestAnimationFrame(() => setPlaced(true))
    return () => cancelAnimationFrame(frameId)
  }, [ready])

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(([entry]) => entry && setBox({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  // The crop: the largest box of the right shape inside the area, less the inset.
  const room = { width: Math.max(0, box.width - inset * 2), height: Math.max(0, box.height - inset * 2) }
  const frame = room.width / room.height > aspect ? { width: room.height * aspect, height: room.height } : { width: room.width, height: room.width / aspect }

  // The picture as turned, and the scale at which it just covers the crop (zoom 1).
  const turned = natural && (sideways(rotation) ? { width: natural.height, height: natural.width } : natural)
  const cover = turned ? Math.max(frame.width / turned.width, frame.height / turned.height) : 1
  const scale = cover * zoom

  /** Keeps the crop inside the picture, at a given zoom and turn. */
  const fit = React.useCallback(
    (point: Point, atScale: number, atRotation: number): Point => {
      if (!natural || !(atScale > 0)) return point
      const size = sideways(atRotation) ? { width: natural.height, height: natural.width } : natural
      const half = { x: natural.width / 2, y: natural.height / 2 }
      // From the picture's centre to the crop's, turned the way it's shown.
      const offset = turn({ x: point.x - half.x, y: point.y - half.y }, atRotation)
      const roomX = Math.max(0, (size.width - frame.width / atScale) / 2)
      const roomY = Math.max(0, (size.height - frame.height / atScale) / 2)
      const back = turn({ x: clamp(offset.x, -roomX, roomX), y: clamp(offset.y, -roomY, roomY) }, -atRotation)
      return { x: half.x + back.x, y: half.y + back.y }
    },
    [natural, frame.width, frame.height]
  )

  const centre = natural ? fit(center ?? { x: natural.width / 2, y: natural.height / 2 }, scale, rotation) : null

  // The area in the picture's pixels, reported whenever it changes.
  const area = React.useMemo<CropArea | null>(() => {
    if (!natural || !centre || !frame.width) return null
    const across = frame.width / scale
    const down = frame.height / scale
    const [exactWidth, exactHeight] = sideways(rotation) ? [down, across] : [across, down]
    // Whole pixels, kept inside the picture, so rounding never adds a sliver from outside it.
    const width = Math.max(1, Math.min(natural.width, Math.round(exactWidth)))
    const height = Math.max(1, Math.min(natural.height, Math.round(exactHeight)))
    return {
      x: clamp(Math.round(centre.x - exactWidth / 2), 0, natural.width - width),
      y: clamp(Math.round(centre.y - exactHeight / 2), 0, natural.height - height),
      width,
      height,
      rotation: ((rotation % 360) + 360) % 360,
    }
  }, [natural, centre?.x, centre?.y, frame.width, frame.height, scale, rotation]) // eslint-disable-line react-hooks/exhaustive-deps

  const onCropChangeRef = React.useRef(onCropChange)
  onCropChangeRef.current = onCropChange
  // The picture is part of it: a new picture of the same size, cropped the same way, is still a new crop.
  const areaKey = area && `${src} ${area.x},${area.y},${area.width},${area.height},${area.rotation}`
  React.useEffect(() => {
    if (area) onCropChangeRef.current?.(area)
  }, [areaKey]) // eslint-disable-line react-hooks/exhaustive-deps

  function setZoom(next: number, around: Point = { x: 0, y: 0 }) {
    const value = clamp(next, minZoom, maxZoom)
    if (value === zoom || !centre) return
    // The point under the pointer (or the crop's centre) stays where it is.
    const nextScale = cover * value
    const shift = turn(around, -rotation)
    const k = 1 / scale - 1 / nextScale
    setCenter(fit({ x: centre.x + shift.x * k, y: centre.y + shift.y * k }, nextScale, rotation))
    if (zoomProp === undefined) setZoomState(value)
    onZoomChange?.(value)
  }

  function moveBy(dx: number, dy: number) {
    if (!centre) return
    const step = turn({ x: dx, y: dy }, -rotation)
    setCenter(fit({ x: centre.x - step.x / scale, y: centre.y - step.y / scale }, scale, rotation))
  }

  function rotate() {
    const next = rotation + 90
    if (rotationProp === undefined) setRotationState(next)
    onRotationChange?.(next)
  }

  // Pointers on the picture: one moves it, two pinch to zoom.
  const pointers = React.useRef(new Map<number, Point>())
  /** The first two pointers on the picture. */
  const pair = () => [...pointers.current.values()] as [Point, Point]
  const pinch = React.useRef<{ distance: number; zoom: number } | null>(null)

  function relative(event: { clientX: number; clientY: number }): Point {
    const rect = viewportRef.current!.getBoundingClientRect()
    return { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !natural || (event.pointerType === "mouse" && event.button !== 0)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = pair()
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom }
    }
    setMoving(true)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const last = pointers.current.get(event.pointerId)
    if (!last) return
    const now = { x: event.clientX, y: event.clientY }
    pointers.current.set(event.pointerId, now)
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = pair()
      const mid = relative({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 })
      setZoom((pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.distance, mid)
    } else if (pointers.current.size === 1) {
      moveBy(now.x - last.x, now.y - last.y)
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) setMoving(false)
  }

  // The wheel zooms around the pointer. It needs a listener that isn't passive, to keep the page from scrolling.
  const wheel = React.useRef<(event: WheelEvent) => void>(() => {})
  wheel.current = (event) => {
    if (disabled || !natural) return
    event.preventDefault()
    // Some mice scroll by lines or pages rather than pixels.
    const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1)
    setZoom(zoom * Math.exp(-clamp(pixels, -200, 200) * 0.002), relative(event))
  }
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const listener = (event: WheelEvent) => wheel.current(event)
    viewport.addEventListener("wheel", listener, { passive: false })
    return () => viewport.removeEventListener("wheel", listener)
  }, [])

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled || !natural) return
    const step = event.shiftKey ? 40 : 8
    // The arrows move the picture the way they point, as a drag would.
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const move = moves[event.key]
    if (move) moveBy(move[0], move[1])
    else if (event.key === "+" || event.key === "=") setZoom(zoom + 0.1)
    else if (event.key === "-" || event.key === "_") setZoom(zoom - 0.1)
    else return
    event.preventDefault()
  }

  // Where the picture sits: its centre moved from the crop's by the turned offset, then scaled and turned.
  const offset = natural && centre ? turn({ x: (natural.width / 2 - centre.x) * scale, y: (natural.height / 2 - centre.y) * scale }, rotation) : { x: 0, y: 0 }

  return (
    <div data-slot="image-cropper" className={cn("grid gap-3", disabled && "opacity-50", className)}>
      <div
        ref={viewportRef}
        role="group"
        aria-label={ariaLabel ?? t("cropArea")}
        aria-describedby={instructionsId}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onLostPointerCapture={onPointerUp}
        onKeyDown={onKeyDown}
        data-moving={moving || undefined}
        style={{ height }}
        className={cn(
          "group/cropper relative isolate touch-none overflow-hidden rounded-lg border bg-muted outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          natural && !disabled && "cursor-grab data-moving:cursor-grabbing",
          classNames?.viewport
        )}
      >
        <span id={instructionsId} className="sr-only">
          {t("cropInstructions")}
        </span>
        <img
          key={src}
          ref={imageRef}
          src={src}
          alt=""
          draggable={false}
          crossOrigin={crossOrigin}
          onLoad={(event) => loaded(event.currentTarget)}
          onError={() => setFailed(true)}
          style={{
            width: natural?.width,
            height: natural?.height,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
          }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-1/2 max-w-none origin-center",
            // Fades in once it's loaded and placed, instead of popping in at its own size; after that zoom and turns glide.
            "transition-opacity duration-(--duration-standard) ease-standard",
            placed ? "opacity-100" : "opacity-0",
            placed && !moving && "transition-[opacity,transform] motion-reduce:transition-opacity",
            classNames?.image
          )}
        />
        {/* While the picture is on its way the area breathes, and a spinner says so after a beat (a quick picture never
            flashes it); both go as the picture fades in. */}
        {!placed && !failed && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-foreground/8 motion-safe:animate-pulse" />
            <span className="pointer-events-none absolute inset-0 grid animate-in place-items-center delay-200 duration-(--duration-standard) fill-mode-both fade-in-0 motion-reduce:animate-none">
              <Spinner size="sm" label={t("loading")} className="text-muted-foreground" />
            </span>
          </>
        )}
        {failed && (
          <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {t("imageFailed")}
          </p>
        )}
        {frame.width > 0 && !failed && (
          <div
            aria-hidden
            style={{ width: frame.width, height: frame.height }}
            className={cn(
              // The outside of the crop dimmed by the frame's own shadow, so it follows a circle as well as a box.
              "pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_9999px_rgb(0_0_0/0.5)] ring-1 ring-white/80",
              // It arrives with the picture, so an empty crop never shows on its own.
              "transition-opacity duration-(--duration-standard) ease-standard",
              placed ? "opacity-100" : "opacity-0",
              shape === "circle" ? "rounded-full" : "rounded-[2px]",
              classNames?.frame
            )}
          >
            {/* Thirds, while the picture moves, to line it up. */}
            <span
              className={cn(
                "absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-(--duration-fast) ease-standard group-data-moving/cropper:opacity-100",
                shape === "circle" && "rounded-full"
              )}
            >
              <span className="absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <span className="absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <span className="absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <span className="absolute inset-x-0 top-2/3 h-px bg-white/40" />
            </span>
          </div>
        )}
      </div>
      {showControls && (
        <div data-slot="image-cropper-controls" className={cn("flex items-center gap-1", classNames?.controls)}>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("zoomOutImage")}
            disabled={disabled || !natural || zoom <= minZoom}
            onClick={() => setZoom(zoom - 0.25)}
          >
            <ZoomOutIcon />
          </Button>
          <Slider
            aria-label={t("zoom")}
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={[zoom]}
            disabled={disabled || !natural}
            onValueChange={([value]) => value !== undefined && setZoom(value)}
            className="mx-1 flex-1"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("zoomInImage")}
            disabled={disabled || !natural || zoom >= maxZoom}
            onClick={() => setZoom(zoom + 0.25)}
          >
            <ZoomInIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("rotateImage")} disabled={disabled || !natural} onClick={rotate} className="ms-1">
            <RotateCwIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

type CropImageOptions = {
  /** Width of the file in pixels; the height follows the crop's shape. The crop's own size by default. */
  width?: number
  /** "image/jpeg" (the default), "image/png" to keep transparency, or "image/webp". */
  type?: string
  /** 0 to 1, for JPEG and WebP. */
  quality?: number
  /** As on the cropper, for a picture on another site. */
  crossOrigin?: "anonymous" | "use-credentials"
}

/**
 * Draws the cropped part of a picture into a Blob, ready to upload: `new File([blob], "avatar.jpg", { type: blob.type })`.
 * Runs in the browser.
 */
async function cropImage(src: string, area: CropArea, { width, type = "image/jpeg", quality = 0.92, crossOrigin }: CropImageOptions = {}) {
  const image = new Image()
  if (crossOrigin) image.crossOrigin = crossOrigin
  image.src = src
  await image.decode()

  // The crop as shown (turned), and the file's size.
  const [shownWidth, shownHeight] = sideways(area.rotation) ? [area.height, area.width] : [area.width, area.height]
  const k = width ? width / shownWidth : 1
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(shownWidth * k))
  canvas.height = Math.max(1, Math.round(shownHeight * k))
  const context = canvas.getContext("2d")!
  context.imageSmoothingQuality = "high"
  // JPEG has no transparency: a transparent picture gets a white ground instead of a black one.
  if (type === "image/jpeg") {
    context.fillStyle = "#fff"
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate((area.rotation * Math.PI) / 180)
  context.scale(k, k)
  context.drawImage(image, -(area.x + area.width / 2), -(area.y + area.height / 2))

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't draw the cropped picture."))), type, quality)
  )
}

export { ImageCropper, cropImage, type ImageCropperProps, type CropArea, type CropImageOptions }
