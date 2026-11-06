"use client"

import * as React from "react"
import { CheckIcon, PipetteIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { type FieldClassNames, type FieldOwnProps } from "./field"
import { Input } from "./input"
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover"

type Hsv = { h: number; s: number; v: number }

/** "#abc" or "#aabbcc" (any case, # optional) as "#aabbcc"; null when it isn't a color. */
function normalizeHex(text: string): string | null {
  const raw = text.trim().replace(/^#/, "").toLowerCase()
  if (/^[0-9a-f]{3}$/.test(raw)) return `#${[...raw].map((c) => c + c).join("")}`
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`
  return null
}

function hexToHsv(hex: string): Hsv {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255) as [number, number, number]
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  // Not rounded: hsvToHex(hexToHsv(hex)) has to give the same hex back, or the picker would keep resyncing.
  return { h: (h * 60 + 360) % 360, s: max ? (d / max) * 100 : 0, v: max * 100 }
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (k: number) => {
    const n = (k + h / 60) % 6
    const value = (v / 100) * (1 - (s / 100) * Math.max(0, Math.min(n, 4 - n, 1)))
    return Math.round(value * 255).toString(16).padStart(2, "0")
  }
  return `#${f(5)}${f(3)}${f(1)}`
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type ColorPickerProps = FieldOwnProps & {
  /** The color as hex, controlled: "#2563eb". */
  value?: string
  defaultValue?: string
  /** Called with the new color as lowercase "#rrggbb", as it's dragged, picked or typed. */
  onValueChange?: (value: string) => void
  /** Colors to pick in one click under the picker: your brand's, or recent ones. */
  swatches?: string[]
  /** A button that picks a color from anywhere on the screen, where the browser can (Chrome, Edge). On by default. */
  eyeDropper?: boolean
  /** The form field's name: the color is sent as "#rrggbb". */
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** The field's classes. */
  className?: string
  classNames?: FieldClassNames & { content?: string }
}

type EyeDropperConstructor = new () => { open: () => Promise<{ sRGBHex: string }> }

/**
 * A color field, in one tag: `<ColorPicker label="Brand color" value={color} onValueChange={setColor} />`. Type a hex
 * value, or open the swatch to drag through saturation, brightness and hue (the arrow keys work too, Shift for big
 * steps), pick a preset, or take one from the screen.
 */
function ColorPicker({
  value,
  defaultValue = "#2563eb",
  onValueChange,
  swatches,
  eyeDropper = true,
  disabled,
  className,
  classNames,
  ...props
}: ColorPickerProps) {
  const { t } = useLocale()
  const [internal, setInternal] = React.useState(() => normalizeHex(defaultValue) ?? "#000000")
  const color = normalizeHex(value ?? internal) ?? "#000000"
  // Hue and saturation are kept apart from the hex: at black or grey they can't be read back, and the hue slider
  // would jump to red.
  const [hsv, setHsv] = React.useState(() => hexToHsv(color))
  if (hsvToHex(hsv) !== color) {
    // The color changed from outside (typed, a swatch, the parent): follow it, keeping the hue where it can't be read.
    const next = hexToHsv(color)
    setHsv(next.s === 0 || next.v === 0 ? { ...next, h: hsv.h } : next)
  }
  const [text, setText] = React.useState(color)
  const [editing, setEditing] = React.useState(false)
  const [canDrop, setCanDrop] = React.useState(false)
  React.useEffect(() => setCanDrop(eyeDropper && "EyeDropper" in window), [eyeDropper])

  function commit(next: string, nextHsv?: Hsv) {
    if (nextHsv) setHsv(nextHsv)
    if (value === undefined) setInternal(next)
    if (next !== color) onValueChange?.(next)
  }
  const fromHsv = (next: Hsv) => commit(hsvToHex(next), next)

  async function drop() {
    const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper
    if (!EyeDropper) return
    try {
      const { sRGBHex } = await new EyeDropper().open()
      const hex = normalizeHex(sRGBHex)
      if (hex) commit(hex)
    } catch {
      // Cancelled with Escape: nothing to do.
    }
  }

  const swatch = (
    <PopoverRoot>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        aria-label={t("pickColor")}
        className="-ms-1 size-6 shrink-0 rounded-sm border border-black/10 shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none dark:border-white/15"
        style={{ backgroundColor: color }}
      />
      <PopoverContent align="start" sideOffset={8} className={cn("grid w-64 gap-3 p-3", classNames?.content)}>
        <SaturationArea hsv={hsv} onChange={fromHsv} />
        <div className="flex items-center gap-2">
          <HueSlider hsv={hsv} onChange={fromHsv} />
          {canDrop && (
            <button
              type="button"
              onClick={drop}
              aria-label={t("pickFromScreen")}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <PipetteIcon aria-hidden />
            </button>
          )}
        </div>
        {swatches && swatches.length > 0 && (
          <div role="group" aria-label={t("swatches")} className="grid grid-cols-8 gap-1.5 border-t pt-3">
            {swatches.map((entry) => {
              const hex = normalizeHex(entry)
              if (!hex) return null
              const picked = hex === color
              return (
                <button
                  key={hex}
                  type="button"
                  aria-label={hex}
                  aria-pressed={picked}
                  onClick={() => commit(hex)}
                  className="grid aspect-square place-items-center rounded-sm border border-black/10 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring/50 motion-safe:hover:scale-110 dark:border-white/15"
                  style={{ backgroundColor: hex }}
                >
                  {picked && <CheckIcon aria-hidden className={cn("size-3.5", hexToHsv(hex).v > 60 && hexToHsv(hex).s < 50 ? "text-black" : "text-white")} />}
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </PopoverRoot>
  )

  return (
    <Input
      {...props}
      disabled={disabled}
      prefix={swatch}
      value={editing ? text : color}
      spellCheck={false}
      autoComplete="off"
      maxLength={7}
      className={cn("font-mono uppercase", className)}
      classNames={classNames}
      onFocus={() => {
        setText(color)
        setEditing(true)
      }}
      onChange={(event) => {
        setText(event.target.value)
        const hex = normalizeHex(event.target.value)
        if (hex) commit(hex)
      }}
      // What was typed but isn't a color goes back to the color on leaving.
      onBlur={() => setEditing(false)}
    />
  )
}

/** Steps for the arrow keys: 1, or 10 with Shift; Page Up and Down take 10 too. */
const keyStep = (event: React.KeyboardEvent) => (event.shiftKey || event.key.startsWith("Page") ? 10 : 1)

/** Follows a pointer from press to release, from wherever it was pressed, with the position as 0–1 across and down. */
function useDrag(onMove: (x: number, y: number) => void) {
  return {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      if (event.button !== 0) return
      const el = event.currentTarget
      el.setPointerCapture(event.pointerId)
      el.focus()
      const move = (e: { clientX: number; clientY: number }) => {
        const rect = el.getBoundingClientRect()
        onMove(clamp((e.clientX - rect.left) / rect.width, 0, 1), clamp((e.clientY - rect.top) / rect.height, 0, 1))
      }
      move(event)
      const up = () => {
        el.removeEventListener("pointermove", move)
        el.removeEventListener("pointerup", up)
        el.removeEventListener("pointercancel", up)
      }
      el.addEventListener("pointermove", move)
      el.addEventListener("pointerup", up)
      el.addEventListener("pointercancel", up)
    },
  }
}

const thumbClass = "pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.25),0_1px_3px_rgb(0_0_0/0.3)]"

/** Saturation across, brightness up: a square of the hue's shades. Colors don't turn around in Arabic, so it's ltr. */
function SaturationArea({ hsv, onChange }: { hsv: Hsv; onChange: (next: Hsv) => void }) {
  const { t } = useLocale()
  const drag = useDrag((x, y) => onChange({ ...hsv, s: x * 100, v: (1 - y) * 100 }))
  const s = Math.round(hsv.s)
  const v = Math.round(hsv.v)
  return (
    <div
      dir="ltr"
      role="slider"
      tabIndex={0}
      aria-label={t("colorArea")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={s}
      aria-valuetext={t("colorAreaValue", { saturation: s, brightness: v })}
      {...drag}
      onKeyDown={(event) => {
        const step = keyStep(event)
        const moves: Record<string, Partial<Hsv>> = {
          ArrowRight: { s: hsv.s + step },
          ArrowLeft: { s: hsv.s - step },
          ArrowUp: { v: hsv.v + step },
          ArrowDown: { v: hsv.v - step },
          PageUp: { v: hsv.v + step },
          PageDown: { v: hsv.v - step },
        }
        const move = moves[event.key]
        if (!move) return
        event.preventDefault()
        onChange({ h: hsv.h, s: clamp(move.s ?? hsv.s, 0, 100), v: clamp(move.v ?? hsv.v, 0, 100) })
      }}
      className="relative h-36 touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
      style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))` }}
    >
      <span className={thumbClass} style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hsvToHex(hsv) }} />
    </div>
  )
}

function HueSlider({ hsv, onChange }: { hsv: Hsv; onChange: (next: Hsv) => void }) {
  const { t } = useLocale()
  const drag = useDrag((x) => onChange({ ...hsv, h: Math.round(x * 360) }))
  const h = Math.round(hsv.h)
  return (
    <div
      dir="ltr"
      role="slider"
      tabIndex={0}
      aria-label={t("hue")}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={h}
      {...drag}
      onKeyDown={(event) => {
        const step = keyStep(event)
        const next =
          event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "PageUp"
            ? hsv.h + step
            : event.key === "ArrowLeft" || event.key === "ArrowDown" || event.key === "PageDown"
              ? hsv.h - step
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? 360
                  : null
        if (next === null) return
        event.preventDefault()
        onChange({ ...hsv, h: clamp(next, 0, 360) })
      }}
      className="relative h-3 flex-1 touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
      style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
    >
      <span className={cn(thumbClass, "top-1/2")} style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }} />
    </div>
  )
}

export { ColorPicker, type ColorPickerProps }
