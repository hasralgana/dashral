"use client"

import * as React from "react"
import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react"
import { AnimatePresence, motion, type PanInfo } from "motion/react"
import { cn } from "@dashral/ui/lib/utils"

import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"
import { Button } from "./button"

type ToastType = "default" | "success" | "info" | "warning" | "error" | "loading"
type ToastId = string | number

export type ToastOptions = {
  /** Pass an existing toast's id to change it in place (a "Saving…" toast becoming "Saved"). */
  id?: ToastId
  description?: React.ReactNode
  /** A button in the toast; clicking it also closes the toast. */
  action?: { label: React.ReactNode; onClick: (event: React.MouseEvent<HTMLButtonElement>) => void }
  /** How long it stays, in milliseconds; Infinity keeps it until it's closed. Loading toasts stay by default. */
  duration?: number
  /** In place of the type's icon. */
  icon?: React.ReactNode
  /** Called when it closes, by its timer, a swipe or toast.dismiss(). */
  onDismiss?: () => void
}

type ToastRecord = ToastOptions & { id: ToastId; type: ToastType; message: React.ReactNode; version: number }

// The toasts on screen, shared by toast() and every <Toaster />.
let toasts: ToastRecord[] = []
let count = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function show(type: ToastType, message: React.ReactNode, options: ToastOptions = {}): ToastId {
  const id = options.id ?? `toast-${++count}`
  const existing = toasts.find((item) => item.id === id)
  const record: ToastRecord = { ...existing, ...options, id, type, message, version: (existing?.version ?? 0) + 1 }
  toasts = existing ? toasts.map((item) => (item.id === id ? record : item)) : [...toasts, record]
  emit()
  return id
}

function dismiss(id?: ToastId) {
  const gone = toasts.filter((item) => id === undefined || item.id === id)
  toasts = id === undefined ? [] : toasts.filter((item) => item.id !== id)
  emit()
  gone.forEach((item) => item.onDismiss?.())
}

type PromiseMessages<T> = {
  loading: React.ReactNode
  success: React.ReactNode | ((data: T) => React.ReactNode)
  error: React.ReactNode | ((error: unknown) => React.ReactNode)
}

/**
 * Shows a toast; returns its id. toast.success, .info, .warning, .error and .loading show the type's icon,
 * toast.promise follows a promise from loading to success or error in one toast, and toast.dismiss closes one (or
 * all). Mount <Toaster /> once near the root of your app.
 */
const toast = Object.assign((message: React.ReactNode, options?: ToastOptions) => show("default", message, options), {
  success: (message: React.ReactNode, options?: ToastOptions) => show("success", message, options),
  info: (message: React.ReactNode, options?: ToastOptions) => show("info", message, options),
  warning: (message: React.ReactNode, options?: ToastOptions) => show("warning", message, options),
  error: (message: React.ReactNode, options?: ToastOptions) => show("error", message, options),
  loading: (message: React.ReactNode, options?: ToastOptions) => show("loading", message, options),
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>, options?: ToastOptions) {
    const id = show("loading", messages.loading, options)
    promise.then(
      (data) => show("success", typeof messages.success === "function" ? messages.success(data) : messages.success, { ...options, id }),
      (error: unknown) => show("error", typeof messages.error === "function" ? messages.error(error) : messages.error, { ...options, id })
    )
    return promise
  },
  dismiss,
})

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const empty: ToastRecord[] = []

const icons: Record<Exclude<ToastType, "default">, React.ReactNode> = {
  success: <CircleCheck className="text-success-text" />,
  info: <Info className="text-info-text" />,
  warning: <TriangleAlert className="text-warning-text" />,
  error: <CircleX className="text-destructive-text" />,
  loading: <Loader2 className="animate-spin" />,
}

type ToasterPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

const positions: Record<ToasterPosition, string> = {
  "top-left": "top-4 start-4",
  "top-center": "top-4 inset-x-0 mx-auto",
  "top-right": "top-4 end-4",
  "bottom-left": "bottom-4 start-4",
  "bottom-center": "bottom-4 inset-x-0 mx-auto",
  "bottom-right": "bottom-4 end-4",
}

export type ToasterProps = {
  /** Where the toasts gather. */
  position?: ToasterPosition
  /** How many show at once; older ones wait their turn. */
  visibleToasts?: number
  /** How long a toast stays, in milliseconds, unless it says otherwise. */
  duration?: number
  className?: string
}

/** How far each older toast peeks out behind the newest while the stack is folded, and the gap when it's spread. */
const peek = 10
const gap = 8

/**
 * The kit's toasts with motion. Mount <Toaster /> once near the root, then call toast() from anywhere, as with the
 * kit's. Toasts fold into a stack: the newest in front, the older ones peeking out behind it, smaller and fainter.
 * Hover (or tap) the stack and it spreads into a list on a spring, holding the timers; leave and it folds back. A new
 * toast springs in from its edge and pushes the stack back; a toast that changes (loading to done) pops its icon over
 * and crosses its words; swipe one sideways to close it, and it follows your finger. With reduced motion toasts only
 * fade, and the stack is always spread.
 */
function Toaster({ position = "bottom-right", visibleToasts = 3, duration: life = 4000, className }: ToasterProps) {
  const all = React.useSyncExternalStore(subscribe, () => toasts, () => empty)
  const [hovered, setHovered] = React.useState(false)
  const reduced = useReducedMotion()
  const bottom = position.startsWith("bottom")
  // Newest first: the one in front.
  const stack = all.slice(-visibleToasts).reverse()
  const spread = hovered || reduced

  // Each toast's own height, as measured: the stack is laid out from them.
  const [heights, setHeights] = React.useState<Record<string, number>>({})
  const measure = React.useCallback((id: ToastId, height: number) => {
    setHeights((known) => (known[id] === height ? known : { ...known, [id]: height }))
  }, [])
  const heightOf = (item: ToastRecord | undefined) => (item ? (heights[String(item.id)] ?? 0) : 0)
  const front = heightOf(stack[0])
  // Older toasts move away from the edge: up in a bottom stack, down in a top one.
  const away = bottom ? -1 : 1
  let reach = 0
  const places = stack.map((item, index) => {
    const offset = spread ? reach : index * peek
    reach += heightOf(item) + gap
    return offset * away
  })
  const total = stack.length ? (spread ? reach - gap : front + peek * Math.min(stack.length - 1, 2)) : 0

  return (
    <section aria-label="Notifications" className={cn("pointer-events-none fixed z-[100] w-[356px] max-w-[calc(100vw-2rem)]", positions[position], className)}>
      <motion.ol
        className="pointer-events-auto relative"
        initial={false}
        animate={{ height: total }}
        transition={reduced ? { duration: 0 } : spring.glide}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <AnimatePresence initial={false}>
          {stack.map((item, index) => (
            <ToastItem
              key={item.id}
              item={item}
              index={index}
              y={places[index] ?? 0}
              // Folded, an older toast is cut to the front one's height, so only its edge shows behind it.
              height={!spread && index > 0 && front ? front : undefined}
              spread={spread}
              bottom={bottom}
              held={hovered}
              life={life}
              reduced={reduced}
              measure={measure}
            />
          ))}
        </AnimatePresence>
      </motion.ol>
    </section>
  )
}

function ToastItem({
  item,
  index,
  y,
  height,
  spread,
  bottom,
  held,
  life,
  reduced,
  measure,
}: {
  item: ToastRecord
  index: number
  y: number
  height?: number
  spread: boolean
  bottom: boolean
  held: boolean
  life: number
  reduced: boolean
  measure: (id: ToastId, height: number) => void
}) {
  // Its timer: how long it has left, counting down only while the stack isn't held. A change (loading to done) starts it over.
  const stay = item.duration ?? (item.type === "loading" ? Infinity : life)
  const left = React.useRef(stay)
  const [dragging, setDragging] = React.useState(false)
  React.useEffect(() => {
    left.current = stay
  }, [stay, item.version])
  React.useEffect(() => {
    if (held || dragging || !Number.isFinite(left.current)) return
    const started = Date.now()
    const timer = setTimeout(() => dismiss(item.id), left.current)
    return () => {
      clearTimeout(timer)
      left.current -= Date.now() - started
    }
  }, [held, dragging, item.id, item.version])

  // Its natural height, for the stack's layout.
  const body = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const node = body.current
    if (!node) return
    const observer = new ResizeObserver(() => measure(item.id, node.offsetHeight))
    observer.observe(node)
    return () => observer.disconnect()
  }, [item.id, measure])

  // Which way it was swiped away, so it leaves that way instead of shrinking.
  const swiped = React.useRef(0)
  const release = (_: unknown, info: PanInfo) => {
    setDragging(false)
    if (Math.abs(info.offset.x) < 80 && Math.abs(info.velocity.x) < 500) return
    swiped.current = Math.sign(info.offset.x || info.velocity.x)
    dismiss(item.id)
  }

  const icon = item.icon ?? (item.type === "default" ? null : icons[item.type])
  // Folded, each one further back is a little smaller and fainter; a fourth would be hidden behind the third.
  const depth = spread ? 0 : index

  return (
    <motion.li
      role="status"
      aria-live="polite"
      data-slot="toast"
      data-type={item.type}
      className={cn(
        "absolute inset-x-0 w-full cursor-grab touch-pan-y overflow-hidden rounded-lg shadow-lg active:cursor-grabbing",
        bottom ? "bottom-0" : "top-0",
        // Behind the front one, nothing in it can be reached until the stack spreads.
        depth > 0 && "pointer-events-none"
      )}
      style={{ zIndex: 100 - index, transformOrigin: bottom ? "50% 0%" : "50% 100%" }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: (bottom ? 1 : -1) * 24, scale: 0.96 }}
      animate={{ opacity: depth > 2 ? 0 : 1 - depth * 0.15, y, scale: 1 - depth * 0.05, height: height ?? "auto" }}
      variants={{
        out: () =>
          reduced
            ? { opacity: 0, transition: { duration: duration.fast } }
            : swiped.current
              ? { x: swiped.current * 400, opacity: 0, transition: { duration: duration.standard, ease: ease.exit } }
              : { opacity: 0, scale: 0.96, transition: { duration: duration.fast, ease: ease.exit } },
      }}
      exit="out"
      transition={reduced ? { duration: duration.fast } : { ...spring.appear, height: spring.glide, opacity: { duration: duration.fast, ease: ease.enter } }}
      drag={reduced || depth > 0 ? false : "x"}
      dragSnapToOrigin
      dragElastic={0.6}
      onDragStart={() => setDragging(true)}
      onDragEnd={release}
    >
      <div
        ref={body}
        className="flex items-start gap-2 rounded-lg border bg-popover p-4 text-sm text-popover-foreground [&_svg]:size-4 [&_svg]:shrink-0"
      >
        {icon && (
          // A new type (loading to done) pops its icon over the old one.
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={item.type}
              className="flex h-5 items-center"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={reduced ? { duration: duration.fast } : spring.pop}
            >
              {icon}
            </motion.span>
          </AnimatePresence>
        )}
        <div className="grid min-w-0 flex-1 gap-0.5 py-px">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={item.version}
              className="grid gap-0.5"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: duration.standard, ease: ease.enter }}
            >
              <p className="leading-5 font-medium">{item.message}</p>
              {item.description && <p className="text-muted-foreground">{item.description}</p>}
            </motion.div>
          </AnimatePresence>
        </div>
        {item.action && (
          // The motion Button: it presses in like every other. Its press doesn't start a swipe of the toast.
          <Button
            size="xs"
            className="shrink-0"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              item.action?.onClick(event)
              dismiss(item.id)
            }}
          >
            {item.action.label}
          </Button>
        )}
      </div>
    </motion.li>
  )
}

export { Toaster, toast }
