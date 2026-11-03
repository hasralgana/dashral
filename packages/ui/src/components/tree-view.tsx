"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, MinusIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type TreeItem = {
  /** Unique in the whole tree: value, expanded and checked hold these. */
  id: string
  label: React.ReactNode
  /** The label as plain text, for filter and type-to-jump, when label isn't a string. */
  textValue?: string
  icon?: React.ReactNode
  /** Shown in place of icon while the branch is open, e.g. an open folder. */
  openIcon?: React.ReactNode
  /** At the end of the row, e.g. a count or a size. */
  suffix?: React.ReactNode
  children?: TreeItem[]
  disabled?: boolean
}

type CheckState = boolean | "mixed"

type TreeViewProps = Omit<React.ComponentProps<"ul">, "defaultValue" | "defaultChecked" | "onSelect"> & {
  items: TreeItem[]
  /** The open branches, controlled. */
  expanded?: string[]
  /** The branches open at first; "all" opens every one. */
  defaultExpanded?: string[] | "all"
  onExpandedChange?: (expanded: string[]) => void
  /** The selected item, controlled. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  /** A checkbox on every row; a branch is ticked when all of its items are, and half-ticked when some are. */
  checkable?: boolean
  /** The ticked leaves (items without children), controlled. */
  checked?: string[]
  defaultChecked?: string[]
  onCheckedChange?: (checked: string[]) => void
  /** Shows the items whose text holds this (and the branches leading to them, opened), with the match marked. */
  filter?: string
  /** Shown when the filter matches nothing. */
  empty?: React.ReactNode
  /** Guide lines down each open branch. */
  lines?: boolean
  classNames?: { item?: string; row?: string; icon?: string; label?: string; suffix?: string; group?: string; empty?: string }
}

const isBranch = (item: TreeItem) => (item.children?.length ?? 0) > 0
const textOf = (item: TreeItem) => item.textValue ?? (typeof item.label === "string" ? item.label : "")

function useControllable<T>(value: T | undefined, initial: T, onChange?: (value: T) => void) {
  const [own, setOwn] = React.useState(initial)
  const current = value === undefined ? own : value
  const set = (next: T) => {
    if (value === undefined) setOwn(next)
    onChange?.(next)
  }
  return [current, set] as const
}

/** Everything the tree needs to know about its items, worked out once per items. */
function indexItems(items: TreeItem[]) {
  const byId = new Map<string, TreeItem>()
  const parentOf = new Map<string, string | null>()
  const leavesOf = new Map<string, string[]>()
  const walk = (list: TreeItem[], parent: string | null): string[] =>
    list.flatMap((item) => {
      byId.set(item.id, item)
      parentOf.set(item.id, parent)
      const leaves = isBranch(item) ? walk(item.children!, item.id) : item.disabled ? [] : [item.id]
      leavesOf.set(item.id, leaves)
      return leaves
    })
  walk(items, null)
  return { byId, parentOf, leavesOf }
}

/** Which items the filter keeps: those that match, their ancestors (opened) and their descendants. */
function filterItems(items: TreeItem[], query: string) {
  const shown = new Set<string>()
  const opened = new Set<string>()
  const showAll = (list: TreeItem[]) => list.forEach((item) => (shown.add(item.id), item.children && showAll(item.children)))
  const walk = (list: TreeItem[]): boolean => {
    let any = false
    for (const item of list) {
      if (textOf(item).toLowerCase().includes(query)) {
        shown.add(item.id)
        if (item.children) showAll(item.children)
        if (item.children && walk(item.children)) opened.add(item.id)
        any = true
      } else if (item.children && walk(item.children)) {
        shown.add(item.id)
        opened.add(item.id)
        any = true
      }
    }
    return any
  }
  walk(items)
  return { shown, opened }
}

/** The label with the filter's match marked, when it's plain text. */
function Highlight({ text, query }: { text: React.ReactNode; query: string }) {
  if (typeof text !== "string" || !query) return text
  const at = text.toLowerCase().indexOf(query)
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-warning/30 text-current">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  )
}

/**
 * Nested items that open and close, in one tag: a file explorer, categories or permissions. Pick one item, or tick
 * several with checkable; filter narrows it down. Follows the WAI-ARIA tree pattern.
 */
function TreeView({
  items,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  checkable = false,
  checked: checkedProp,
  defaultChecked = [],
  onCheckedChange,
  filter = "",
  empty: emptyProp,
  lines = true,
  className,
  classNames,
  onKeyDown,
  ...props
}: TreeViewProps) {
  const { t, dir } = useLocale()
  const empty = emptyProp ?? t("noMatches")
  const { byId, parentOf, leavesOf } = React.useMemo(() => indexItems(items), [items])
  const [expanded, setExpanded] = useControllable(
    expandedProp,
    defaultExpanded === "all" ? [...byId.values()].filter(isBranch).map((item) => item.id) : (defaultExpanded ?? []),
    onExpandedChange
  )
  const [value, setValue] = useControllable<string | null>(valueProp, defaultValue, onValueChange as (value: string | null) => void)
  const [checked, setChecked] = useControllable(checkedProp, defaultChecked, onCheckedChange)
  const [focused, setFocused] = React.useState<string | null>(null)
  const baseId = React.useId()

  const query = filter.trim().toLowerCase()
  const filtered = React.useMemo(() => (query ? filterItems(items, query) : null), [items, query])
  // While filtering, the branches leading to a match are open; closing one is remembered until the filter changes.
  const [closedWhileFiltering, setClosedWhileFiltering] = React.useState({ query, ids: new Set<string>() })
  if (closedWhileFiltering.query !== query) setClosedWhileFiltering({ query, ids: new Set() })

  const expandedSet = new Set(expanded)
  const isOpen = (id: string) =>
    filtered?.opened.has(id) ? !closedWhileFiltering.ids.has(id) : expandedSet.has(id)
  const isShown = (id: string) => !filtered || filtered.shown.has(id)

  const toggle = (id: string, open = !isOpen(id)) => {
    if (filtered?.opened.has(id)) {
      const ids = new Set(closedWhileFiltering.ids)
      if (open) ids.delete(id)
      else ids.add(id)
      setClosedWhileFiltering({ query, ids })
    } else if (open !== expandedSet.has(id)) {
      setExpanded(open ? [...expanded, id] : expanded.filter((other) => other !== id))
    }
  }

  const checkedSet = new Set(checked)
  const checkState = (id: string): CheckState => {
    const leaves = leavesOf.get(id) ?? []
    if (!isBranch(byId.get(id)!)) return checkedSet.has(id)
    const ticked = leaves.filter((leaf) => checkedSet.has(leaf)).length
    return ticked === 0 ? false : ticked === leaves.length ? true : "mixed"
  }
  const toggleChecked = (id: string) => {
    const leaves = leavesOf.get(id) ?? []
    const next = new Set(checkedSet)
    if (checkState(id) === true) leaves.forEach((leaf) => next.delete(leaf))
    else leaves.forEach((leaf) => next.add(leaf))
    setChecked([...next])
  }

  // The rows on screen, top to bottom: what the arrow keys move through.
  const visible: string[] = []
  const collect = (list: TreeItem[]) =>
    list.forEach((item) => {
      if (!isShown(item.id)) return
      visible.push(item.id)
      if (isBranch(item) && isOpen(item.id)) collect(item.children!)
    })
  collect(items)

  // One row takes Tab (roving tabindex): the focused one, else the selected one, else the first.
  const tabStop = [focused, value].find((id) => id && visible.includes(id)) ?? visible[0]

  const rows = React.useRef(new Map<string, HTMLLIElement>())
  const focusRow = (id: string | undefined) => {
    if (!id) return
    setFocused(id)
    rows.current.get(id)?.focus()
  }

  // Branches are rendered once first opened, then kept so they can slide closed.
  const rendered = React.useRef(new Set<string>())

  const activate = (item: TreeItem) => {
    if (item.disabled) return
    if (checkable) toggleChecked(item.id)
    else setValue(item.id)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event)
    const id = (event.target as HTMLElement).closest<HTMLElement>("[role=treeitem]")?.dataset.id
    if (event.defaultPrevented || !id || event.altKey || event.ctrlKey || event.metaKey) return
    const item = byId.get(id)!
    const at = visible.indexOf(id)
    const handled = () => event.preventDefault()
    // Right to left, the arrow pointing into a branch is the left one.
    const key = dir === "rtl" && event.key === "ArrowLeft" ? "ArrowRight" : dir === "rtl" && event.key === "ArrowRight" ? "ArrowLeft" : event.key
    switch (key) {
      case "ArrowDown":
        handled()
        return focusRow(visible[at + 1])
      case "ArrowUp":
        handled()
        return focusRow(visible[at - 1])
      case "Home":
        handled()
        return focusRow(visible[0])
      case "End":
        handled()
        return focusRow(visible.at(-1))
      case "ArrowRight":
        handled()
        if (!isBranch(item)) return
        return isOpen(id) ? focusRow(item.children!.find((child) => isShown(child.id))?.id) : toggle(id, true)
      case "ArrowLeft":
        handled()
        if (isBranch(item) && isOpen(id)) return toggle(id, false)
        return focusRow(parentOf.get(id) ?? undefined)
      case "Enter":
      case " ":
        handled()
        return activate(item)
      case "*": {
        // Opens every branch beside this one.
        handled()
        const parent = parentOf.get(id)
        const siblings = (parent ? byId.get(parent)!.children! : items).filter((sibling) => isBranch(sibling) && isShown(sibling.id))
        const ids = siblings.filter((sibling) => !isOpen(sibling.id)).map((sibling) => sibling.id)
        const plain = ids.filter((other) => !filtered?.opened.has(other))
        if (plain.length) setExpanded([...expanded, ...plain])
        if (plain.length < ids.length) {
          const closed = new Set(closedWhileFiltering.ids)
          ids.forEach((other) => closed.delete(other))
          setClosedWhileFiltering({ query, ids: closed })
        }
        return
      }
      default:
        // Type a letter to jump to the next row that starts with it.
        if (event.key.length === 1 && /\S/.test(event.key)) {
          handled()
          const key = event.key.toLowerCase()
          const order = [...visible.slice(at + 1), ...visible.slice(0, at)]
          focusRow(order.find((other) => textOf(byId.get(other)!).toLowerCase().startsWith(key)))
        }
    }
  }

  const renderItems = (list: TreeItem[], level: number): React.ReactNode => {
    const shown = list.filter((item) => isShown(item.id))
    return shown.map((item, index) => {
      const branch = isBranch(item)
      const open = branch && isOpen(item.id)
      if (open) rendered.current.add(item.id)
      const state = checkable ? checkState(item.id) : undefined
      const selected = !checkable && value === item.id
      const labelId = `${baseId}-${item.id}`
      return (
        <li
          key={item.id}
          ref={(node) => {
            if (node) rows.current.set(item.id, node)
            else rows.current.delete(item.id)
          }}
          role="treeitem"
          data-id={item.id}
          aria-labelledby={labelId}
          aria-level={level}
          aria-setsize={shown.length}
          aria-posinset={index + 1}
          aria-expanded={branch ? open : undefined}
          aria-selected={checkable ? undefined : selected}
          aria-checked={state}
          aria-disabled={item.disabled || undefined}
          tabIndex={item.id === tabStop ? 0 : -1}
          onFocus={(event) => event.target === event.currentTarget && setFocused(item.id)}
          className={cn("outline-none [&:focus-visible>[data-slot=tree-row]]:ring-2 [&:focus-visible>[data-slot=tree-row]]:ring-ring/50", classNames?.item)}
        >
          <div
            data-slot="tree-row"
            data-selected={selected || undefined}
            data-disabled={item.disabled || undefined}
            onClick={() => {
              focusRow(item.id)
              if (branch) toggle(item.id)
              if (!checkable || !branch) activate(item)
            }}
            className={cn(
              "relative flex h-8 cursor-default items-center gap-1.5 rounded-md px-1.5 text-sm transition-colors select-none hover:bg-accent/60 data-disabled:pointer-events-none data-disabled:opacity-50 data-selected:bg-accent data-selected:font-medium data-selected:text-accent-foreground",
              // On a guide line, the selected row marks its stretch of the line.
              lines && level > 1 && "data-selected:before:absolute data-selected:before:inset-y-1 data-selected:before:-start-[7px] data-selected:before:w-px data-selected:before:bg-primary",
              classNames?.row
            )}
          >
            <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
              {branch && (
                <ChevronRightIcon
                  className={cn("size-4 transition-transform duration-(--duration-standard) ease-spring rtl:-scale-x-100", open && "rotate-90 rtl:-rotate-90")}
                />
              )}
            </span>
            {checkable && (
              <span
                aria-hidden
                data-state={state === "mixed" ? "indeterminate" : state ? "checked" : "unchecked"}
                onClick={(event) => {
                  // The box ticks a branch without opening it.
                  event.stopPropagation()
                  focusRow(item.id)
                  activate(item)
                }}
                className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input shadow-xs transition-[color,background-color,border-color] data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
              >
                {state === true && <CheckIcon className="size-3.5 animate-in zoom-in-50 fade-in-0 duration-(--duration-standard) ease-spring motion-reduce:animate-none" />}
                {state === "mixed" && <MinusIcon className="size-3.5" />}
              </span>
            )}
            {(item.icon || item.openIcon) && (
              <span aria-hidden className={cn("flex shrink-0 text-muted-foreground [&_svg]:size-4", classNames?.icon)}>
                {open ? (item.openIcon ?? item.icon) : item.icon}
              </span>
            )}
            <span id={labelId} className={cn("min-w-0 flex-1 truncate", classNames?.label)}>
              <Highlight text={item.label} query={query} />
            </span>
            {item.suffix != null && (
              <span className={cn("shrink-0 text-xs text-muted-foreground tabular-nums", classNames?.suffix)}>{item.suffix}</span>
            )}
          </div>
          {branch && (open || rendered.current.has(item.id)) && (
            // Opens and closes by sliding grid rows between 0fr and 1fr, so it follows the content's height.
            <div
              inert={!open}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-(--duration-standard) ease-standard motion-reduce:transition-none",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <ul role="group" className={cn("ms-3.5 border-s ps-1.5", lines ? "border-border" : "border-transparent", classNames?.group)}>
                  {renderItems(item.children!, level + 1)}
                </ul>
              </div>
            </div>
          )}
        </li>
      )
    })
  }

  if (visible.length === 0 && query) {
    return (
      <p data-slot="tree-view-empty" className={cn("px-2 py-6 text-center text-sm text-muted-foreground", className, classNames?.empty)}>
        {empty}
      </p>
    )
  }

  return (
    <ul data-slot="tree-view" role="tree" onKeyDown={handleKeyDown} className={cn("text-sm", className)} {...props}>
      {renderItems(items, 1)}
    </ul>
  )
}

export { TreeView, type TreeViewProps, type TreeItem }
