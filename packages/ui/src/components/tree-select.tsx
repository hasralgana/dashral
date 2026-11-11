"use client"

import * as React from "react"
import { ChevronRightIcon, ChevronsUpDownIcon, SearchIcon, XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { PopoverRoot, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover"
import { TreeView, type TreeItem } from "./tree-view"

type TreeSelectBase = FieldOwnProps & {
  /** The nested options; each id is unique in the whole tree. Children make an item a branch. */
  items: TreeItem[]
  placeholder?: string
  searchPlaceholder?: string
  /** Shown when the search matches nothing. */
  emptyText?: string
  /** A search box above the tree. On by default. */
  searchable?: boolean
  /** The branches open the first time it opens; "all" opens every one. The branches leading to the value open too. */
  defaultExpanded?: string[] | "all"
  /** Sends the value with a form: one hidden input, or one per value with multiple. */
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  "aria-label"?: string
  /** The field's classes. */
  className?: string
  classNames?: FieldClassNames & { trigger?: string; content?: string; tree?: string }
}

type TreeSelectSingle = TreeSelectBase & {
  multiple?: false
  /** The picked item's id, controlled; null for none. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string | null) => void
  /** "leaf": only items without children can be picked, and a branch only opens. Any item by default. */
  selectable?: "any" | "leaf"
}

type TreeSelectMultiple = TreeSelectBase & {
  /** A checkbox on every row: a branch ticks all of its items, and is half-ticked when some are. */
  multiple: true
  /** The ticked items without children, controlled. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** Chips shown before the rest collapse into "+3". */
  maxShown?: number
  selectable?: never
}

type TreeSelectProps = TreeSelectSingle | TreeSelectMultiple

const isBranch = (item: TreeItem) => (item.children?.length ?? 0) > 0
const textOf = (item: TreeItem) => item.textValue ?? (typeof item.label === "string" ? item.label : "")

/** Each item by id, its parent, and the enabled items without children under it. */
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

/** The ids from the top of the tree down to this one. */
function pathTo(id: string, parentOf: Map<string, string | null>) {
  const path: string[] = []
  for (let at: string | null | undefined = id; at; at = parentOf.get(at)) path.unshift(at)
  return path
}

/**
 * A field that picks from nested options, in one tag: a province, city and district, or a product's category. It
 * shows the whole path of what's picked; the list opens as a tree with a search. With multiple, every row has a
 * checkbox and what's ticked shows as chips, a whole ticked branch as one.
 */
function TreeSelect(props: TreeSelectProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      {/* The label as text names the tree inside the list too. */}
      <TreeSelectControl {...(control as ControlProps)} treeLabel={typeof props.label === "string" ? props.label : undefined} />
    </FieldWrapper>
  )
}

type ControlProps = Omit<TreeSelectProps, keyof FieldOwnProps | "required">

function TreeSelectControl({ treeLabel, items, ...props }: ControlProps & { treeLabel?: string }) {
  const {
    placeholder: placeholderProp,
    searchPlaceholder: searchPlaceholderProp,
    emptyText: emptyTextProp,
    searchable = true,
    defaultExpanded,
    name,
    className,
    classNames,
    "aria-label": ariaLabel,
  } = props
  const multiple = props.multiple === true
  const leafOnly = !multiple && (props as TreeSelectSingle).selectable === "leaf"
  const maxShown = multiple ? ((props as TreeSelectMultiple).maxShown ?? 3) : 0

  const { t } = useLocale()
  const placeholder = placeholderProp ?? t(multiple ? "selectOptions" : "selectOption")
  const searchPlaceholder = searchPlaceholderProp ?? t("search")
  const emptyText = emptyTextProp ?? t("noMatches")
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: props.id, disabled: props.disabled, "aria-invalid": props["aria-invalid"] })
  const { byId, parentOf, leavesOf } = React.useMemo(() => indexItems(items), [items])

  // The value, controlled or not: a single id (or null), or the ticked ids.
  const [ownSingle, setOwnSingle] = React.useState<string | null>(multiple ? null : ((props as TreeSelectSingle).defaultValue ?? null))
  const [ownMultiple, setOwnMultiple] = React.useState<string[]>(multiple ? ((props as TreeSelectMultiple).defaultValue ?? []) : [])
  const single = multiple ? null : (props as TreeSelectSingle).value !== undefined ? ((props as TreeSelectSingle).value ?? null) : ownSingle
  const ticked = multiple ? ((props as TreeSelectMultiple).value ?? ownMultiple) : []
  // Ids that aren't in the tree (any more) are left out of what's shown.
  const picked = single !== null && byId.has(single) ? single : null
  const tickedKnown = ticked.filter((leaf) => byId.has(leaf))

  function setSingle(next: string | null) {
    if ((props as TreeSelectSingle).value === undefined) setOwnSingle(next)
    ;(props as TreeSelectSingle).onValueChange?.(next)
  }
  function setTicked(next: string[]) {
    if ((props as TreeSelectMultiple).value === undefined) setOwnMultiple(next)
    ;(props as TreeSelectMultiple).onValueChange?.(next)
  }

  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const contentRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  // The open branches, kept between openings. Each time it opens, the branches leading to what's picked open too.
  const [expanded, setExpanded] = React.useState<string[]>(() =>
    defaultExpanded === "all" ? [...byId.values()].filter(isBranch).map((item) => item.id) : (defaultExpanded ?? [])
  )
  function openChange(next: boolean) {
    if (disabled && next) return
    setOpen(next)
    if (!next) return setQuery("")
    const toReveal = multiple ? tickedKnown : picked ? [picked] : []
    const ancestors = new Set(expanded)
    toReveal.forEach((leaf) => pathTo(leaf, parentOf).slice(0, -1).forEach((branch) => ancestors.add(branch)))
    setExpanded([...ancestors])
  }

  /** Moves focus from the search into the tree, onto its current row. */
  function focusTree() {
    const row = contentRef.current?.querySelector<HTMLElement>('[role=treeitem][tabindex="0"]')
    row?.focus()
  }

  // Chips: a branch whose items are all ticked shows as one chip, the highest such branch.
  // Worked out on each render: it walks the tree once, which is cheap next to drawing it.
  const chips = ((): string[] => {
    if (!multiple) return []
    const set = new Set(tickedKnown)
    const full = (branchId: string) => {
      const leaves = leavesOf.get(branchId) ?? []
      return leaves.length > 0 && leaves.every((leaf) => set.has(leaf))
    }
    const out: string[] = []
    const walk = (list: TreeItem[]) =>
      list.forEach((item) => {
        if (isBranch(item)) {
          if (full(item.id)) out.push(item.id)
          else walk(item.children!)
        } else if (set.has(item.id)) out.push(item.id)
      })
    walk(items)
    return out
  })()

  const removeChip = (chipId: string) => {
    const leaves = isBranch(byId.get(chipId)!) ? (leavesOf.get(chipId) ?? []) : [chipId]
    setTicked(ticked.filter((leaf) => !leaves.includes(leaf)))
  }

  const path = picked ? pathTo(picked, parentOf).map((step) => byId.get(step)!) : []
  const hasValue = multiple ? tickedKnown.length > 0 : picked !== null

  const trigger = (
    <PopoverTrigger asChild>
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="tree"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        disabled={disabled}
        onKeyDown={(event) => {
          if (multiple && event.key === "Backspace" && chips.length > 0) {
            event.preventDefault()
            removeChip(chips.at(-1)!)
          }
        }}
        className={cn(
          multiple
            ? "flex h-7 min-w-16 flex-1 items-center justify-between gap-2 rounded-sm px-1.5 text-start outline-none"
            : "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-start text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/15",
          !multiple && classNames?.trigger
        )}
      >
        {multiple ? (
          <span className={cn("truncate", hasValue ? "sr-only" : "text-muted-foreground")}>
            {hasValue ? t("selectedCount", { count: tickedKnown.length }) : placeholder}
          </span>
        ) : path.length > 0 ? (
          // The path, the picked item last and in full; the ones before it give way first when it's narrow.
          <span data-slot="tree-select-value" className="flex min-w-0 flex-1 items-center gap-1">
            {path.length > 1 && (
              <span className="flex min-w-0 shrink items-center gap-1 text-muted-foreground">
                <span className="truncate">{path.slice(0, -1).map(textOf).join(" › ")}</span>
                <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 opacity-60 rtl:-scale-x-100" />
                <span className="sr-only">, </span>
              </span>
            )}
            <span className="max-w-full min-w-0 shrink-0 truncate">{textOf(path.at(-1)!)}</span>
          </span>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDownIcon className="ms-auto size-4 shrink-0 opacity-50" aria-hidden />
      </button>
    </PopoverTrigger>
  )

  return (
    <PopoverRoot open={open} onOpenChange={openChange}>
      {multiple ? (
        <PopoverAnchor asChild>
          <div
            data-slot="tree-select"
            data-disabled={disabled || undefined}
            className={cn(
              "flex min-h-9 w-full items-center gap-1 rounded-md border border-input bg-transparent py-1 pe-1 ps-1.5 text-sm shadow-xs transition-[color,box-shadow]",
              "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15 data-disabled:pointer-events-none data-disabled:opacity-50",
              "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
              className,
              classNames?.trigger
            )}
          >
            {chips.length > 0 && (
              <ul aria-label={t("selected")} className="flex min-w-0 flex-wrap items-center gap-1">
                {chips.slice(0, maxShown).map((chipId) => {
                  const label = textOf(byId.get(chipId)!)
                  return (
                    <li
                      key={chipId}
                      className="inline-flex h-6 max-w-48 animate-in items-center gap-0.5 rounded bg-secondary ps-2 pe-0.5 text-xs font-medium text-secondary-foreground duration-(--duration-fast) ease-enter fade-in-0 zoom-in-95 motion-reduce:animate-none"
                    >
                      <span className="truncate">{label}</span>
                      <button
                        type="button"
                        aria-label={t("remove", { name: label })}
                        className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/15"
                        onClick={() => removeChip(chipId)}
                      >
                        <XIcon className="size-3" aria-hidden />
                      </button>
                    </li>
                  )
                })}
                {chips.length > maxShown && <li className="px-1 text-xs text-muted-foreground tabular-nums">+{chips.length - maxShown}</li>}
              </ul>
            )}
            {trigger}
          </div>
        </PopoverAnchor>
      ) : (
        <div data-slot="tree-select" className={cn("w-full", className)}>
          {trigger}
        </div>
      )}
      {name &&
        (multiple ? (
          tickedKnown.map((leaf) => <input key={leaf} type="hidden" name={name} value={leaf} />)
        ) : (
          <input type="hidden" name={name} value={picked ?? ""} />
        ))}
      <PopoverContent
        ref={contentRef}
        align="start"
        // As tall as the room on screen allows; the tree scrolls inside it.
        className={cn("flex max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) min-w-64 flex-col overflow-hidden p-0", classNames?.content)}
        // Focus goes to the search, or straight to the tree without one.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          requestAnimationFrame(() => {
            // What's picked is scrolled into view, in a long tree.
            contentRef.current?.querySelector('[role=treeitem][aria-selected=true], [role=treeitem][aria-checked=true]')?.scrollIntoView({ block: "nearest" })
            if (searchable) searchRef.current?.focus()
            else focusTree()
          })
        }}
      >
        {searchable && (
          <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              role="searchbox"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  focusTree()
                }
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                aria-label={t("clearFilter")}
                onClick={() => {
                  setQuery("")
                  searchRef.current?.focus()
                }}
                className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}
        <div
          className="max-h-72 min-h-0 flex-1 overflow-y-auto p-1"
          // When a branch can be picked, its arrow only opens or closes it, so you can reach what's inside without
          // picking the branch (its label picks it). The arrow is the row's first part.
          onClickCapture={(event) => {
            if (multiple || leafOnly) return
            const target = event.target as HTMLElement
            const row = target.closest<HTMLElement>("[data-slot=tree-row]")
            const arrow = row?.firstElementChild
            const rowId = row?.closest<HTMLElement>("[role=treeitem]")?.dataset.id
            const item = rowId ? byId.get(rowId) : undefined
            if (!arrow || !item || !isBranch(item) || !arrow.contains(target)) return
            event.stopPropagation()
            setExpanded(expanded.includes(item.id) ? expanded.filter((other) => other !== item.id) : [...expanded, item.id])
          }}
        >
          <TreeView
            items={items}
            aria-label={ariaLabel ?? treeLabel ?? placeholder}
            expanded={expanded}
            onExpandedChange={setExpanded}
            filter={query}
            empty={emptyText}
            checkable={multiple}
            checked={multiple ? tickedKnown : undefined}
            onCheckedChange={multiple ? setTicked : undefined}
            value={multiple ? undefined : picked}
            onValueChange={
              multiple
                ? undefined
                : (next) => {
                    const item = byId.get(next)
                    if (!item || (leafOnly && isBranch(item))) return
                    // Picking the current item again clears it, as in Combobox.
                    setSingle(next === picked ? null : next)
                    setOpen(false)
                    setQuery("")
                  }
            }
            onKeyDown={(event) => {
              // With selectable="leaf", Enter or Space on a branch opens or closes it instead of picking it.
              const rowId = (event.target as HTMLElement).closest<HTMLElement>("[role=treeitem]")?.dataset.id
              const item = rowId ? byId.get(rowId) : undefined
              if (leafOnly && item && isBranch(item) && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault()
                setExpanded(expanded.includes(item.id) ? expanded.filter((other) => other !== item.id) : [...expanded, item.id])
              }
            }}
            className={classNames?.tree}
          />
        </div>
        {hasValue && (
          <div className="shrink-0 border-t p-1">
            <button
              type="button"
              onClick={() => {
                if (multiple) setTicked([])
                else {
                  setSingle(null)
                  setOpen(false)
                }
              }}
              className="flex h-8 w-full items-center justify-center rounded-md text-sm text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {t("clearSelection")}
            </button>
          </div>
        )}
      </PopoverContent>
    </PopoverRoot>
  )
}

export { TreeSelect, type TreeSelectProps }
