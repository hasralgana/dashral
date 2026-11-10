"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { CountTo } from "../lib/count-to"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

const percentOptions: Intl.NumberFormatOptions = { style: "percent", maximumFractionDigits: 1 }

export type TreemapDatum = {
  label: string
  /** Ignored when there are children: a group's value is theirs added up. */
  value?: number
  /** Any CSS color; by default the theme's chart colors in order (--chart-1 … --chart-5). Children take their group's. */
  color?: string
  /** Makes it a group: click it to zoom in. */
  children?: TreemapDatum[]
}

type TreemapProps = Omit<React.ComponentProps<"div">, "children"> & {
  data: TreemapDatum[]
  /** Height in pixels; the width fills the container. */
  height?: number
  /** BCP 47 locale for values and percentages. */
  locale?: string
  /** How values are written, e.g. `{ style: "currency", currency: "USD" }`. */
  formatOptions?: Intl.NumberFormatOptions
  /** The name of the top level in the trail, e.g. "All products". */
  rootLabel?: string
  /** The trail (and the hovered tile's details) above the tiles. */
  showHeader?: boolean
  /** What the chart shows, e.g. "Storage by folder". */
  "aria-label"?: string
  classNames?: { header?: string; tile?: string; label?: string; value?: string }
}

type Rect = { x: number; y: number; w: number; h: number }
type Tile = { datum: TreemapDatum; key: string; index: number; value: number; color: string; rect: Rect }

const colorAt = (i: number) => `var(--chart-${(i % 5) + 1})`
const valueOf = (d: TreemapDatum): number =>
  d.children?.length ? d.children.reduce((sum, child) => sum + valueOf(child), 0) : Math.max(0, d.value ?? 0)

/**
 * Squarified treemap (Bruls, Huizing and van Wijk): lays values out as rectangles inside a w × h box, each area in
 * proportion, as close to square as it can. Returns one rect per value, in the values' order.
 */
function squarify(values: number[], width: number, height: number): Rect[] {
  const out: Rect[] = values.map(() => ({ x: 0, y: 0, w: 0, h: 0 }))
  const total = values.reduce((sum, v) => sum + v, 0)
  if (!total) return out
  const scale = (width * height) / total
  const order = values
    .map((v, i) => ({ area: v * scale, i }))
    .filter((d) => d.area > 0)
    .sort((a, b) => b.area - a.area)
  let box = { x: 0, y: 0, w: width, h: height }
  let row: typeof order = []
  // How far from square the worst rect in a row is, laid along a side this long.
  const worst = (items: typeof order, side: number) => {
    const sum = items.reduce((s, d) => s + d.area, 0)
    const max = Math.max(...items.map((d) => d.area))
    const min = Math.min(...items.map((d) => d.area))
    return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min))
  }
  const place = () => {
    const sum = row.reduce((s, d) => s + d.area, 0)
    if (box.w >= box.h) {
      // A column down the left of what's left.
      const w = Math.min(box.w, sum / box.h)
      let y = box.y
      for (const d of row) {
        out[d.i] = { x: box.x, y, w, h: d.area / w }
        y += d.area / w
      }
      box = { x: box.x + w, y: box.y, w: box.w - w, h: box.h }
    } else {
      // A row along the top.
      const h = Math.min(box.h, sum / box.w)
      let x = box.x
      for (const d of row) {
        out[d.i] = { x, y: box.y, w: d.area / h, h }
        x += d.area / h
      }
      box = { x: box.x, y: box.y + h, w: box.w, h: box.h - h }
    }
    row = []
  }
  for (const d of order) {
    const side = Math.min(box.w, box.h)
    if (row.length && worst([...row, d], side) > worst(row, side)) place()
    row.push(d)
  }
  place()
  return out
}

/** Rects in 0–100 units (percent of the box), laid out for a box with this width-to-height ratio. */
function layout(values: number[], ratio: number): Rect[] {
  const aspect = Math.min(Math.max(ratio || 1, 0.01), 100)
  return squarify(values, aspect * 100, 100).map((r) => ({ x: r.x / aspect, y: r.y, w: r.w / aspect, h: r.h }))
}

const place = (r: Rect): React.CSSProperties => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` })

/**
 * Parts of a whole as rectangles, sized by value — for many parts, or parts within parts (storage by folder, revenue
 * by product). A group shows its items faintly inside; click it and they zoom out to fill the chart. Plain HTML, no
 * chart library: labels are real text, and every value is listed for screen readers.
 */
function Treemap({
  data,
  height = 280,
  locale: localeProp,
  formatOptions,
  rootLabel: rootLabelProp,
  showHeader = true,
  className,
  classNames,
  "aria-label": ariaLabelProp,
  onKeyDown,
  ...props
}: TreemapProps) {
  const { t, locale: contextLocale } = useLocale()
  const locale = localeProp ?? contextLocale
  const rootLabel = rootLabelProp ?? t("all")
  const ariaLabel = ariaLabelProp ?? t("treemap")
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(height * 2)
  React.useLayoutEffect(() => {
    const node = box.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // The groups zoomed into, as indexes from the top.
  const [path, setPath] = React.useState<number[]>([])
  const [active, setActive] = React.useState<string | null>(null)
  const trail = path.reduce<TreemapDatum[]>((list, i) => [...list, (list.at(-1)?.children ?? data)[i]!], [])
  // A path that no longer fits the data (it changed) falls back to the top.
  const valid = trail.every((d) => d?.children?.length)
  const level = valid ? (trail.at(-1)?.children ?? data) : data
  const levelPath = valid ? path : []
  const groupColor = valid ? trail.reduce<string | undefined>((color, d, n) => d.color ?? color ?? colorAt(path[n]!), undefined) : undefined

  const aspect = width / height
  const values = level.map(valueOf)
  const total = values.reduce((sum, v) => sum + v, 0)
  const tiles: Tile[] = layout(values, aspect).map((rect, index) => ({
    datum: level[index]!,
    key: [...levelPath, index].join("/"),
    index,
    value: values[index]!,
    color: level[index]!.color ?? groupColor ?? colorAt(index),
    rect,
  }))
  // A group's label sits in a strip along its top (when there's room for it), and its items are laid out below.
  const STRIP = 28
  const size = (tile: Tile) => ({ w: (tile.rect.w / 100) * width, h: (tile.rect.h / 100) * height })
  const stripOf = (tile: Tile) => (tile.datum.children?.length && size(tile).w >= 56 && size(tile).h >= STRIP * 2 ? STRIP : 0)
  // Each group's items, in percent of the area under the strip.
  const inner = (tile: Tile) =>
    tile.datum.children?.length
      ? layout(tile.datum.children.map(valueOf), size(tile).w / Math.max(1e-6, size(tile).h - stripOf(tile)))
      : []

  // Where each tile starts before sliding to its place: a zoom in grows the group's items from where they sat in it;
  // a zoom out shrinks the group back from the whole chart; the first time, every tile grows from its middle.
  const [from, setFrom] = React.useState<Map<string, Rect> | null>(() => new Map())
  React.useEffect(() => {
    if (!from) return
    let frame = requestAnimationFrame(() => (frame = requestAnimationFrame(() => setFrom(null))))
    return () => cancelAnimationFrame(frame)
  }, [from])
  const start = (tile: Tile): { rect: Rect; hidden?: boolean } => {
    if (!from) return { rect: tile.rect }
    if (from.size === 0) return { rect: { x: tile.rect.x + tile.rect.w / 2, y: tile.rect.y + tile.rect.h / 2, w: 0, h: 0 }, hidden: true }
    const rect = from.get(tile.key)
    return rect ? { rect } : { rect: tile.rect, hidden: true }
  }

  const tileRefs = React.useRef(new Map<string, HTMLButtonElement>())
  const trailRef = React.useRef<HTMLButtonElement>(null)
  const [focusAfter, setFocusAfter] = React.useState<string | "trail" | null>(null)
  React.useEffect(() => {
    if (!focusAfter) return
    ;(focusAfter === "trail" ? trailRef.current : tileRefs.current.get(focusAfter))?.focus()
    setFocusAfter(null)
  }, [focusAfter])

  const zoomIn = (tile: Tile) => {
    // The area under the strip, in percent of the chart.
    const strip = (stripOf(tile) / height) * 100
    const r = { ...tile.rect, y: tile.rect.y + strip, h: tile.rect.h - strip }
    setFrom(new Map(inner(tile).map((c, i) => [[...levelPath, tile.index, i].join("/"), { x: r.x + (c.x * r.w) / 100, y: r.y + (c.y * r.h) / 100, w: (c.w * r.w) / 100, h: (c.h * r.h) / 100 }])))
    setPath([...levelPath, tile.index])
    setActive(null)
    setFocusAfter("trail")
  }
  const zoomTo = (depth: number) => {
    if (depth >= levelPath.length) return
    const key = levelPath.slice(0, depth + 1).join("/")
    setFrom(new Map([[key, { x: 0, y: 0, w: 100, h: 100 }]]))
    setPath(levelPath.slice(0, depth))
    setActive(null)
    setFocusAfter(key)
  }

  const format = new Intl.NumberFormat(locale, formatOptions)
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 })
  const describe = (tile: Tile) => `${tile.datum.label}: ${format.format(tile.value)} (${percent.format(total ? tile.value / total : 0)})`
  const hovered = tiles.find((tile) => tile.key === active)
  const crumbs = [rootLabel, ...trail.map((d) => d.label)]

  return (
    <div
      data-slot="treemap"
      role="group"
      aria-label={ariaLabel}
      className={cn("grid gap-2", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.key === "Escape" && levelPath.length && !event.defaultPrevented) {
          event.preventDefault()
          zoomTo(levelPath.length - 1)
        }
      }}
      {...props}
    >
      {showHeader && (
        <div className={cn("flex min-h-6 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm", classNames?.header)}>
          <nav aria-label={t("treemapLevels")} className="flex min-w-0 items-center gap-1">
            {crumbs.map((label, depth) => {
              const current = depth === levelPath.length
              return (
                <React.Fragment key={depth}>
                  {depth > 0 && <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />}
                  {current ? (
                    <span aria-current="page" className="truncate font-medium">
                      {label}
                      <span className="ms-2 font-normal text-muted-foreground tabular-nums">
                        <CountTo value={total} locale={locale} formatOptions={formatOptions} />
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      ref={depth === levelPath.length - 1 ? trailRef : undefined}
                      onClick={() => zoomTo(depth)}
                      className="truncate rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                      {label}
                    </button>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
          <p aria-live="polite" className="truncate text-muted-foreground tabular-nums">
            {hovered && (
              <>
                <span className="text-foreground">{hovered.datum.label}</span>{" "}
                {/* Moving from tile to tile counts the numbers to the new one's; read out once, in full. */}
                <span aria-hidden>
                  <CountTo value={hovered.value} locale={locale} formatOptions={formatOptions} /> ·{" "}
                  <CountTo value={total ? hovered.value / total : 0} locale={locale} formatOptions={percentOptions} />
                </span>
                <span className="sr-only">
                  {format.format(hovered.value)} · {percent.format(total ? hovered.value / total : 0)}
                </span>
              </>
            )}
          </p>
        </div>
      )}
      <div ref={box} className="relative w-full" style={{ height }}>
        <ul className="absolute inset-0">
          {tiles.map((tile) => {
            const group = !!tile.datum.children?.length
            const begin = start(tile)
            const px = size(tile)
            const strip = stripOf(tile)
            const showLabel = px.w >= 56 && px.h >= 30
            const showValue = px.w >= 56 && px.h >= 50
            const body = group ? (
              <>
                {strip > 0 && (
                  <span className="flex h-7 min-w-0 items-center gap-1.5 px-2 text-xs">
                    <span className={cn("truncate font-medium text-foreground", classNames?.label)}>{tile.datum.label}</span>
                    {px.w >= 120 && (
                      <span className={cn("shrink-0 text-muted-foreground tabular-nums", classNames?.value)}>
                        <CountTo value={tile.value} locale={locale} formatOptions={formatOptions} />
                      </span>
                    )}
                  </span>
                )}
                <span aria-hidden className="absolute inset-x-0 bottom-0" style={{ top: strip }}>
                  {inner(tile).map((c, i) => (
                    <span
                      key={i}
                      className="absolute rounded-[3px] border border-(--tile)/25"
                      style={{ left: `calc(${c.x}% + 2px)`, top: `calc(${c.y}% + 2px)`, width: `calc(${c.w}% - 4px)`, height: `calc(${c.h}% - 4px)` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              <span className="grid min-w-0 gap-0.5 p-2">
                {showLabel && <span className={cn("truncate text-xs font-medium text-foreground", classNames?.label)}>{tile.datum.label}</span>}
                {showValue && (
                  <span className={cn("truncate text-xs text-muted-foreground tabular-nums", classNames?.value)}>
                    <CountTo value={tile.value} locale={locale} formatOptions={formatOptions} />
                  </span>
                )}
              </span>
            )
            const tileClass = cn(
              "relative flex size-full flex-col items-stretch justify-start overflow-hidden rounded-md text-start bg-[color-mix(in_oklab,var(--tile)_20%,var(--card))] shadow-[inset_0_2px_0_var(--tile),inset_0_0_0_1px_color-mix(in_oklab,var(--tile)_35%,transparent)] transition-[background-color,opacity] outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring/50",
              group && "cursor-zoom-in hover:bg-[color-mix(in_oklab,var(--tile)_30%,var(--card))]",
              classNames?.tile
            )
            return (
              <li
                key={tile.key}
                className={cn(
                  "absolute p-px transition-[left,top,width,height,opacity] duration-(--duration-considered) motion-reduce:transition-none",
                  from?.size === 0 ? "ease-enter" : "ease-standard",
                  tile.value === 0 && "hidden"
                )}
                style={{
                  ...place(begin.rect),
                  "--tile": tile.color,
                  opacity: begin.hidden ? 0 : active && active !== tile.key ? 0.5 : 1,
                } as React.CSSProperties}
                onPointerEnter={() => setActive(tile.key)}
                onPointerLeave={() => setActive(null)}
                title={describe(tile)}
              >
                {group ? (
                  <button
                    type="button"
                    ref={(node) => {
                      if (node) tileRefs.current.set(tile.key, node)
                      else tileRefs.current.delete(tile.key)
                    }}
                    aria-label={t("zoomIn", { name: describe(tile) })}
                    onClick={() => zoomIn(tile)}
                    onFocus={() => setActive(tile.key)}
                    onBlur={() => setActive(null)}
                    className={tileClass}
                  >
                    {body}
                  </button>
                ) : (
                  <div className={tileClass}>
                    <span className="sr-only">{describe(tile)}</span>
                    <span aria-hidden>{body}</span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export { Treemap, type TreemapProps }
