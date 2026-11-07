"use client"

import * as React from "react"
import {
  type Announcements,
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  type Modifier,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { GripVerticalIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cssDuration, reducedMotion } from "../lib/motion"
import { cn } from "../lib/utils"

type SortableItem = {
  /** A stable, unique key: the order you get back is a list of these items. */
  id: string
  /** The row's main line, or the caption under a tile. */
  title: React.ReactNode
  /** A second line under it. */
  description?: React.ReactNode
  /** At the start of a row (an icon in a tile, an Avatar), or the picture that fills a tile in a grid. */
  media?: React.ReactNode
  /** At the end of a row, quiet: a status Badge, a count. */
  meta?: React.ReactNode
  /** At the very end of a row, or over a tile's corner: buttons, a Switch, a menu. They keep their own clicks. */
  actions?: React.ReactNode
  /** Its name as plain text, for screen readers, when title isn't text. */
  label?: string
  /** Stays where it is: it can't be picked up, and nothing can be dropped past it (a column that's always first). */
  disabled?: boolean
}

type SortableMove = { id: string; from: number; to: number }

type SortableProps = Omit<React.ComponentProps<"ul">, "children"> & {
  items: SortableItem[]
  /** The new order after each drop, and the move that made it. Without it the list keeps its order itself. */
  onReorder?: (items: SortableItem[], move: SortableMove) => void
  /** list: rows that move up and down. grid: tiles that move anywhere (a product's photos). */
  layout?: "list" | "grid"
  /** What you pick up: a grip at the start (the row's own buttons and fields stay free), or the whole item. A list
   * defaults to the grip, a grid to the whole tile. */
  dragBy?: "handle" | "item"
  /** Its position before each item (1, 2, 3), for priorities: it follows the item while you drag. */
  numbered?: boolean
  /** default: rows on the page; card: inside a bordered card of their own. A list only. */
  variant?: "default" | "card"
  /** Lines between the rows. On by default. A list only. */
  divided?: boolean
  /** sm for a popover, a sidebar or a dense panel. */
  size?: "sm" | "default"
  /** Nothing can move. */
  disabled?: boolean
  /** Shown in place of the items when there are none, e.g. an EmptyState. */
  empty?: React.ReactNode
  classNames?: { item?: string; handle?: string; media?: string; title?: string; description?: string; meta?: string; actions?: string }
}

// A list moves only up and down; both stay inside the list, so a card's edge never clips the item you hold.
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 })
const insideList: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  if (!draggingNodeRect || !containerNodeRect) return transform
  const x = Math.min(Math.max(transform.x, containerNodeRect.left - draggingNodeRect.left), containerNodeRect.right - draggingNodeRect.right)
  const y = Math.min(Math.max(transform.y, containerNodeRect.top - draggingNodeRect.top), containerNodeRect.bottom - draggingNodeRect.bottom)
  return { ...transform, x, y }
}

// Pressing a button, link or field inside an item never picks the item up.
const interactive = "button, a[href], input, textarea, select, label, [contenteditable=''], [contenteditable='true'], [role='switch'], [role='checkbox'], [data-no-drag]"

/**
 * Items you put in order by dragging: a menu, priorities, a table's columns, a product's photos. Rows in a list or
 * tiles in a grid, in one tag, with the same parts as List. Pick one up with the pointer (press and hold on a touch
 * screen, or grab its grip), or from the keyboard with Space, move it with the arrow keys and drop it with Space; each
 * step is announced. The others slide out of its way, and onReorder gets the new order.
 */
function Sortable({
  items,
  onReorder,
  layout = "list",
  dragBy = layout === "grid" ? "item" : "handle",
  numbered = false,
  variant = "default",
  divided = true,
  size = "default",
  disabled = false,
  empty,
  className,
  classNames,
  ...props
}: SortableProps) {
  const { t } = useLocale()
  const id = React.useId()
  const grid = layout === "grid"

  // The order on screen. It follows `items` whenever their ids or order change (you saved a move, added an item), and
  // keeps its own moves otherwise, so the list works with or without onReorder.
  const key = items.map((item) => item.id).join("\u0000")
  const [seen, setSeen] = React.useState(key)
  const [order, setOrder] = React.useState(() => items.map((item) => item.id))
  if (key !== seen) {
    setSeen(key)
    setOrder(items.map((item) => item.id))
  }
  const byId = new Map(items.map((item) => [item.id, item]))
  const shown = order.map((itemId) => byId.get(itemId)).filter((item) => item !== undefined)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A grip is made for dragging, so a touch on it starts at once; a whole item waits for a press and hold, so a
    // swipe across the list still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: dragBy === "handle" ? { distance: 4 } : { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates, keyboardCodes: { start: ["Space", "Enter"], cancel: ["Escape"], end: ["Space", "Enter"] } })
  )

  const name = (itemId: string | number) => {
    const item = byId.get(String(itemId))
    if (!item) return String(itemId)
    return item.label ?? (typeof item.title === "string" || typeof item.title === "number" ? String(item.title) : item.id)
  }
  // Items that stay put split the list into stretches; an item moves only within its own stretch, so nothing ever
  // pushes a fixed one out of its place.
  const fixed = new Set(shown.filter((item) => item.disabled).map((item) => item.id))
  const stretch = (itemId: string) => {
    let s = 0
    for (const other of order) {
      if (other === itemId) return s
      if (fixed.has(other)) s++
    }
    return -1
  }
  const collisionDetection: CollisionDetection = (args) => {
    if (fixed.size === 0) return closestCenter(args)
    const own = stretch(String(args.active.id))
    return closestCenter({ ...args, droppableContainers: args.droppableContainers.filter((c) => !fixed.has(String(c.id)) && stretch(String(c.id)) === own) })
  }
  const position = (itemId: string | number | undefined) => (itemId === undefined ? 0 : order.indexOf(String(itemId)) + 1)
  const count = order.length
  // Picking an item up puts it over itself: that's not a move yet, so the "Picked up" line isn't talked over.
  const moved = React.useRef(false)
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      moved.current = false
      return t("sortablePicked", { name: name(active.id), position: position(active.id), count })
    },
    onDragOver: ({ active, over }) => {
      if (!over || (!moved.current && over.id === active.id)) return undefined
      moved.current = true
      return t("sortableOver", { name: name(active.id), position: position(over.id), count })
    },
    onDragEnd: ({ active, over }) => (over ? t("sortableDropped", { name: name(active.id), position: position(over.id), count }) : undefined),
    onDragCancel: ({ active }) => t("sortableCancelled", { name: name(active.id), position: position(active.id) }),
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = order.indexOf(String(active.id))
    const to = order.indexOf(String(over.id))
    if (from < 0 || to < 0 || stretch(order[from]!) !== stretch(order[to]!)) return
    const next = arrayMove(order, from, to)
    setOrder(next)
    onReorder?.(next.map((itemId) => byId.get(itemId)).filter((item) => item !== undefined), { id: String(active.id), from, to })
  }

  if (items.length === 0 && empty !== undefined) return <>{empty}</>

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={collisionDetection}
      modifiers={grid ? [insideList] : [verticalOnly, insideList]}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("sortableInstructions") } }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={order} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy} disabled={disabled}>
        <ul
          role="list"
          data-slot="sortable"
          data-layout={layout}
          className={cn(
            grid
              ? "grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3"
              : cn("grid", divided && "divide-y", variant === "card" && "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs"),
            "text-sm",
            className
          )}
          {...props}
        >
          {shown.map((item, i) => (
            <SortableRow
              key={item.id}
              item={item}
              index={i}
              grid={grid}
              dragBy={dragBy}
              numbered={numbered}
              rounded={variant === "default" && !divided}
              sm={size === "sm"}
              disabled={disabled || !!item.disabled}
              label={name(item.id)}
              classNames={classNames}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({
  item,
  index,
  grid,
  dragBy,
  numbered,
  rounded,
  sm,
  disabled,
  label,
  classNames,
}: {
  item: SortableItem
  index: number
  grid: boolean
  dragBy: "handle" | "item"
  numbered: boolean
  rounded: boolean
  sm: boolean
  disabled: boolean
  label: string
  classNames: SortableProps["classNames"]
}) {
  const { t, locale } = useLocale()
  // The others slide out of the way on the kit's standard timing; with reduced motion they're simply there. Read once
  // mounted, so the server and the first render agree.
  const [transition, setTransition] = React.useState<{ duration: number; easing: string } | null>({ duration: 240, easing: "cubic-bezier(0.2, 0, 0, 1)" })
  React.useEffect(() => {
    setTransition(reducedMotion() ? null : { duration: cssDuration("--duration-standard", 240), easing: "cubic-bezier(0.2, 0, 0, 1)" })
  }, [])
  const sortable = useSortable({ id: item.id, disabled, transition })
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging, activeIndex, overIndex } = sortable

  // Where it sits right now, while something is held: the numbers count with the items as they slide.
  let place = index
  if (activeIndex >= 0 && overIndex >= 0) {
    if (index === activeIndex) place = overIndex
    else if (activeIndex < index && index <= overIndex) place = index - 1
    else if (overIndex <= index && index < activeIndex) place = index + 1
  }

  const handleDrag = dragBy === "handle"
  // The whole item: skip presses that start on its own buttons and fields.
  const itemListeners =
    !handleDrag && listeners
      ? Object.fromEntries(
          Object.entries(listeners).map(([event, handler]) => [
            event,
            (e: React.SyntheticEvent) => {
              const target = e.target as Element
              if (e.type !== "keydown" && target !== e.currentTarget && target.closest(interactive)) return
              ;(handler as (e: React.SyntheticEvent) => void)(e)
            },
          ])
        )
      : undefined

  const roledescription = t("sortableItem")
  const grip = handleDrag && (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-roledescription={roledescription}
      aria-label={t("sortableReorder", { name: label })}
      disabled={disabled}
      data-slot="sortable-handle"
      className={cn(
        "grid shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent",
        sm ? "size-6 [&_svg]:size-3.5" : "size-7 [&_svg]:size-4",
        grid && "absolute start-3 top-3 z-10 bg-background/85 shadow-xs backdrop-blur-sm",
        classNames?.handle
      )}
    >
      <GripVerticalIcon aria-hidden />
    </button>
  )
  const number = numbered && (
    <span
      aria-hidden
      className={cn(
        "shrink-0 text-center font-medium text-muted-foreground tabular-nums",
        grid
          ? cn("absolute top-1.5 z-10 grid h-6 min-w-6 place-items-center rounded-md bg-background/85 px-1.5 text-xs shadow-xs backdrop-blur-sm", handleDrag ? "start-11" : "start-3")
          : "min-w-5 text-xs"
      )}
    >
      {new Intl.NumberFormat(locale).format(place + 1)}
    </span>
  )

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition: sortable.transition,
  }

  // The item you hold rises above the rest: a card's surface and a shadow, the cursor a closed hand.
  const lifted = isDragging && "relative z-20 cursor-grabbing bg-card shadow-lg ring-1 ring-border"

  if (grid) {
    return (
      <li
        ref={setNodeRef}
        style={style}
        data-slot="sortable-item"
        data-dragging={isDragging || undefined}
        data-disabled={disabled || undefined}
        {...(!handleDrag ? { ...attributes, "aria-roledescription": roledescription, "aria-label": label } : {})}
        {...itemListeners}
        className={cn(
          // A little room all round, outside the tile's place (the negative margin): unseen at rest, it's the card's padding
          // when the tile is lifted and the focus ring's gap.
          "group/sortable relative -m-1.5 grid min-w-0 content-start gap-2 rounded-xl p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          !handleDrag && !disabled && "cursor-grab touch-manipulation",
          disabled && !handleDrag && "opacity-60",
          lifted,
          classNames?.item
        )}
      >
        {grip}
        {number}
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-lg border bg-muted [&_img]:size-full [&_img]:object-cover [&_img]:select-none [&_img]:[-webkit-user-drag:none]",
            classNames?.media
          )}
        >
          {item.media}
        </div>
        {item.actions !== undefined && (
          <div className={cn("absolute end-3 top-3 z-10 flex items-center gap-1", classNames?.actions)}>{item.actions}</div>
        )}
        <div className="grid min-w-0 gap-0.5 px-0.5">
          <span className={cn("truncate font-medium", sm ? "text-xs" : "text-[13px]", classNames?.title)}>{item.title}</span>
          {item.description && <span className={cn("truncate text-xs text-muted-foreground", classNames?.description)}>{item.description}</span>}
          {item.meta !== undefined && <div className={cn("flex items-center gap-2 text-xs text-muted-foreground tabular-nums", classNames?.meta)}>{item.meta}</div>}
        </div>
      </li>
    )
  }

  const trailing = item.meta !== undefined || item.actions !== undefined
  return (
    <li
      ref={setNodeRef}
      style={style}
      data-slot="sortable-item"
      data-dragging={isDragging || undefined}
      data-disabled={disabled || undefined}
      {...(!handleDrag ? { ...attributes, "aria-roledescription": roledescription, "aria-label": label } : {})}
      {...itemListeners}
      className={cn(
        "relative flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        sm ? "gap-2 px-2 py-1.5" : "gap-3 px-3 py-2.5",
        rounded && "rounded-lg",
        !handleDrag && !disabled && "cursor-grab touch-manipulation",
        disabled && !handleDrag && "opacity-60",
        lifted,
        isDragging && "rounded-lg",
        classNames?.item
      )}
    >
      {grip}
      {number}
      {item.media && <div className={cn("flex shrink-0 items-center", classNames?.media)}>{item.media}</div>}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className={cn("block truncate font-medium", classNames?.title)}>{item.title}</span>
        {item.description && (
          <span className={cn("truncate text-muted-foreground", sm ? "text-xs" : "text-[13px]", classNames?.description)}>{item.description}</span>
        )}
      </div>
      {trailing && (
        <div className="flex shrink-0 items-center gap-3">
          {item.meta !== undefined && (
            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground tabular-nums", classNames?.meta)}>{item.meta}</div>
          )}
          {item.actions !== undefined && <div className={cn("flex items-center gap-1.5", classNames?.actions)}>{item.actions}</div>}
        </div>
      )}
    </li>
  )
}

export { Sortable, type SortableItem, type SortableMove, type SortableProps }
