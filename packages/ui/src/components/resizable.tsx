"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

// Panels whose sizes the user changes by dragging the handle between them, or with the keyboard: focus a handle, then
// the arrow keys (Shift for bigger steps), Home and End. Follows the WAI-ARIA window splitter pattern. Sizes are
// percentages of the group. Panels and handles are direct children of the group and alternate — panel, handle, panel —
// which is how the group tells them apart (checking component types doesn't work across the server/client boundary).

type Direction = "horizontal" | "vertical"
type PanelSpec = { defaultSize?: number; minSize: number; maxSize: number }
type GroupContext = {
  direction: Direction
  sizes: number[]
  specs: PanelSpec[]
  ids: string[]
  resize: (handle: number, delta: number) => void
  setFirst: (handle: number, size: number) => void
  measure: (handle: number) => { before: number; after: number }
}

const Context = React.createContext<GroupContext | null>(null)
const useGroup = () => {
  const context = React.useContext(Context)
  if (!context) throw new Error("ResizablePanel and ResizableHandle go inside a ResizablePanelGroup.")
  return context
}


/** Panels without a defaultSize share what the others leave. */
function initialSizes(specs: PanelSpec[]) {
  const given = specs.reduce((sum, s) => sum + (s.defaultSize ?? 0), 0)
  const open = specs.filter((s) => s.defaultSize === undefined).length
  return specs.map((s) => s.defaultSize ?? Math.max(0, 100 - given) / Math.max(open, 1))
}

function ResizablePanelGroup({
  direction = "horizontal",
  onLayout,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "dir"> & {
  direction?: Direction
  /** Called with every panel's size (percent) when a resize ends — store it to restore the layout next time. */
  onLayout?: (sizes: number[]) => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const baseId = React.useId()
  const items = React.Children.toArray(children).filter(React.isValidElement)
  // Even positions are panels, odd ones handles.
  const panels = items.filter((_, i) => i % 2 === 0) as React.ReactElement<ResizablePanelProps>[]
  const specs: PanelSpec[] = panels.map((p) => ({
    defaultSize: p.props.defaultSize,
    minSize: p.props.minSize ?? 0,
    maxSize: p.props.maxSize ?? 100,
  }))
  const [sizes, setSizes] = React.useState(() => initialSizes(specs))
  const ids = specs.map((_, i) => `${baseId}-panel-${i}`)
  const latest = React.useRef(sizes)
  latest.current = sizes

  /** Moves the boundary after panel `handle` by `delta` percent, within both panels' limits. */
  function resize(handle: number, delta: number) {
    setSizes((current) => {
      const a = specs[handle]!
      const b = specs[handle + 1]!
      const pair = current[handle]! + current[handle + 1]!
      const low = Math.max(a.minSize, pair - b.maxSize)
      const high = Math.min(a.maxSize, pair - b.minSize)
      const first = Math.min(high, Math.max(low, current[handle]! + delta))
      const next = [...current]
      next[handle] = first
      next[handle + 1] = pair - first
      return next
    })
  }

  const context: GroupContext = {
    direction,
    sizes,
    specs,
    ids,
    resize,
    setFirst: (handle, size) => resize(handle, size - latest.current[handle]!),
    measure: (handle) => {
      const panels = ref.current?.querySelectorAll<HTMLElement>(":scope > [data-slot=resizable-panel]")
      const rect = (i: number) => panels?.[i]?.getBoundingClientRect()
      const length = (r: DOMRect | undefined) => (r ? (direction === "horizontal" ? r.width : r.height) : 0)
      return { before: length(rect(handle)), after: length(rect(handle + 1)) }
    },
  }

  // Tell the page the final layout once a drag or key press is over.
  const settled = React.useRef(sizes)
  React.useEffect(() => {
    const done = () => {
      if (settled.current !== latest.current) onLayout?.(latest.current)
      settled.current = latest.current
    }
    window.addEventListener("pointerup", done)
    window.addEventListener("keyup", done)
    return () => {
      window.removeEventListener("pointerup", done)
      window.removeEventListener("keyup", done)
    }
  }, [onLayout])

  let panel = 0
  let handle = 0
  return (
    <Context.Provider value={context}>
      <div
        ref={ref}
        data-slot="resizable-panel-group"
        data-direction={direction}
        className={cn("flex size-full", direction === "vertical" && "flex-col", className)}
        {...props}
      >
        {items.map((child, i) =>
          React.cloneElement(child as React.ReactElement<{ index: number }>, { index: i % 2 === 0 ? panel++ : handle++ })
        )}
      </div>
    </Context.Provider>
  )
}

type ResizablePanelProps = React.ComponentProps<"div"> & {
  /** Starting size in percent of the group. */
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

function ResizablePanel({ className, style, index = 0, defaultSize: _d, minSize: _min, maxSize: _max, ...props }: ResizablePanelProps & { index?: number }) {
  const { sizes, ids } = useGroup()
  return (
    <div
      data-slot="resizable-panel"
      id={ids[index]}
      className={cn("min-h-0 min-w-0 overflow-hidden", className)}
      style={{ flex: `${sizes[index] ?? 0} 1 0px`, ...style }}
      {...props}
    />
  )
}

type ResizableHandleProps = React.ComponentProps<"div"> & {
  /** Show a grip on the handle, so it's easier to find. */
  withHandle?: boolean
}

function ResizableHandle({ withHandle, className, index = 0, "aria-label": ariaLabelProp, ...props }: ResizableHandleProps & { index?: number }) {
  const { direction, sizes, specs, ids, resize, setFirst, measure } = useGroup()
  // Where the drag began and the panel's size then, so the size follows the pointer exactly (and catches up after
  // being held at a limit).
  const drag = React.useRef<{ start: number; size: number; unitsPerPixel: number } | null>(null)
  const horizontal = direction === "horizontal"
  const size = sizes[index] ?? 0
  // Right to left, the first panel is on the right: moving the line left makes it bigger.
  const { dir, t } = useLocale()
  const ariaLabel = ariaLabelProp ?? t("resize")
  const sign = horizontal && dir === "rtl" ? -1 : 1

  return (
    <div
      data-slot="resizable-handle"
      role="separator"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-controls={ids[index]}
      // A horizontal group is split by vertical lines.
      aria-orientation={horizontal ? "vertical" : "horizontal"}
      aria-valuenow={Math.round(size)}
      aria-valuemin={Math.round(specs[index]?.minSize ?? 0)}
      aria-valuemax={Math.round(specs[index]?.maxSize ?? 100)}
      data-direction={direction}
      className={cn(
        "relative flex shrink-0 touch-none items-center justify-center bg-border outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/50",
        horizontal
          ? "w-px cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2"
          : "h-px cursor-row-resize after:absolute after:inset-x-0 after:top-1/2 after:h-2 after:-translate-y-1/2",
        "hover:bg-ring/60 data-[dragging]:bg-ring",
        className
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        event.currentTarget.setAttribute("data-dragging", "")
        const { before, after } = measure(index)
        const pair = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0)
        drag.current = { start: horizontal ? event.clientX : event.clientY, size, unitsPerPixel: before + after ? pair / (before + after) : 0 }
      }}
      onPointerMove={(event) => {
        if (!drag.current) return
        const position = horizontal ? event.clientX : event.clientY
        setFirst(index, drag.current.size + sign * (position - drag.current.start) * drag.current.unitsPerPixel)
      }}
      onPointerUp={(event) => {
        drag.current = null
        event.currentTarget.removeAttribute("data-dragging")
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 10 : 2
        const back = horizontal ? (sign < 0 ? "ArrowRight" : "ArrowLeft") : "ArrowUp"
        const forward = horizontal ? (sign < 0 ? "ArrowLeft" : "ArrowRight") : "ArrowDown"
        if (event.key === back) resize(index, -step)
        else if (event.key === forward) resize(index, step)
        else if (event.key === "Home") setFirst(index, specs[index]?.minSize ?? 0)
        else if (event.key === "End") setFirst(index, specs[index]?.maxSize ?? 100)
        else return
        event.preventDefault()
      }}
      {...props}
    >
      {withHandle && (
        <span aria-hidden className={cn("z-10 flex items-center justify-center rounded-sm border bg-border", horizontal ? "h-4 w-3" : "h-3 w-4 rotate-90")}>
          <GripVerticalIcon className="size-2.5" />
        </span>
      )}
    </div>
  )
}

type ResizablePanelSpec = {
  content: React.ReactNode
  /** Starting size in percent of the group. */
  defaultSize?: number
  minSize?: number
  maxSize?: number
  className?: string
}

type ResizableProps = Omit<React.ComponentProps<"div">, "dir" | "children"> & {
  /** The panels in order, with a handle between each two. Put another Resizable in a panel to split it the other way. */
  panels: ResizablePanelSpec[]
  direction?: Direction
  /** A grip on each handle, so it's easier to find. */
  withHandle?: boolean
  /** Called with every panel's size (percent) when a resize ends — store it to restore the layout next time. */
  onLayout?: (sizes: number[]) => void
  classNames?: { panel?: string; handle?: string }
}

/** Panels split by handles you drag (or move with the arrow keys), in one tag. */
function Resizable({ panels, withHandle, classNames, ...props }: ResizableProps) {
  return (
    <ResizablePanelGroup {...props}>
      {panels.flatMap((panel, i) => [
        ...(i > 0 ? [<ResizableHandle key={`handle-${i}`} withHandle={withHandle} className={classNames?.handle} />] : []),
        <ResizablePanel
          key={`panel-${i}`}
          defaultSize={panel.defaultSize}
          minSize={panel.minSize}
          maxSize={panel.maxSize}
          className={cn(classNames?.panel, panel.className)}
        >
          {panel.content}
        </ResizablePanel>,
      ])}
    </ResizablePanelGroup>
  )
}

export { Resizable, type ResizableProps, type ResizablePanelSpec }
