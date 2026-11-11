"use client"

import * as React from "react"
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  constructFilterFn,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  ListFilter,
  Loader2,
  PlusCircle,
  Search,
  SearchX,
  Settings2,
  X,
} from "lucide-react"

import { exportRows, type ExportCell, type ExportFormat } from "../lib/export"
import { useLoadMore } from "../lib/load-more"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import { Input } from "./input"
import { Select } from "./select"
import { ScrollShadow } from "./scroll-shadow"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"

/** Keeps rows whose value equals one of the selected options (used by faceted filters). */
const filterFn_oneOf = constructFilterFn({
  filter: (dataValue, filterValue: unknown[]) => filterValue.includes(dataValue),
  autoRemove: (value) => !Array.isArray(value) || value.length === 0,
})

/**
 * Features registered for every DataTable (TanStack Table v9 registers features explicitly).
 * Define your columns against this type: `createDataTableColumnHelper<MyRow>()`.
 */
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, oneOf: filterFn_oneOf },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
})

export type DataTableFeatures = typeof dataTableFeatures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>
export type DataTableInstance<TData extends RowData> = ReactTable<DataTableFeatures, TData>

export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

export type DataTableFilter = {
  /** Column id to filter. The column needs `filterFn: "oneOf"`. */
  column: string
  title: string
  options: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }[]
}

/** A selection checkbox, labelled in the current language. */
function SelectCheckbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean | "indeterminate"
  onCheckedChange: (checked: boolean) => void
  label: "selectAllRows" | "selectRow"
}) {
  const { t } = useLocale()
  // In a flex box, so the header's box and the rows' sit at the same height: on their own they'd sit on each line's
  // text, and the header's text is smaller.
  return (
    <span className="flex items-center">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(!!value)} aria-label={t(label)} />
    </span>
  )
}

/** Checkbox column for row selection. Put it first in your columns array. */
export function dataTableSelectColumn<TData extends RowData>(): DataTableColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <SelectCheckbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
        label="selectAllRows"
      />
    ),
    cell: ({ row }) => <SelectCheckbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(value)} label="selectRow" />,
    enableSorting: false,
    enableHiding: false,
    enableGlobalFilter: false,
  }
}

/** Sortable column header. Use as `header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />`. */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: {
  column: Column<DataTableFeatures, TData, TValue>
  title: string
  className?: string
}) {
  if (!column.getCanSort()) return <div className={className}>{title}</div>

  const sorted = column.getIsSorted()
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(sorted === "asc")}
      // 12px of padding each side, and pulled back by exactly that (-ms-3, or -me-3 in a column aligned to the end),
      // so the label lines up with the cells under it. Never narrower than its label, so a narrow table widens the
      // column instead of pushing the label sideways. Its text is the header's size (text-xs), like a column that
      // doesn't sort.
      className={cn("-ms-3 h-8 min-w-max px-3 text-xs has-[svg:not([data-spinner])]:px-3 data-[state=sorted]:text-foreground", className)}
      data-state={sorted ? "sorted" : undefined}
    >
      {title}
      <Icon className="size-3.5" aria-hidden />
    </Button>
  )
}

function DataTableFacetedFilter<TData extends RowData>({
  table,
  filter,
}: {
  table: DataTableInstance<TData>
  filter: DataTableFilter
}) {
  const { t } = useLocale()
  const column = table.getColumn(filter.column)
  if (!column) return null

  const counts = column.getFacetedUniqueValues()
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? [])

  function toggle(value: string, checked: boolean) {
    if (checked) selected.add(value)
    else selected.delete(value)
    column!.setFilterValue(selected.size ? [...selected] : undefined)
  }

  return (
    <DropdownMenu
      align="start"
      className="w-52"
      trigger={
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle />
          {filter.title}
          {selected.size > 0 && (
            <Badge color="neutral" className="ms-1 rounded-sm px-1 font-normal">
              {selected.size}
            </Badge>
          )}
        </Button>
      }
      items={[
        { type: "label", label: filter.title },
        { type: "separator" },
        ...filter.options.map((option) => ({
          type: "checkbox" as const,
          checked: selected.has(option.value),
          onCheckedChange: (checked: boolean) => toggle(option.value, checked),
          icon: option.icon && <option.icon className="size-4 text-muted-foreground" />,
          label: (
            <>
              {option.label}
              <span className="ms-auto font-mono text-xs text-muted-foreground tabular-nums">{counts.get(option.value) ?? 0}</span>
            </>
          ),
        })),
        ...(selected.size > 0
          ? [{ type: "separator" as const }, { label: t("clearFilter"), onSelect: () => column.setFilterValue(undefined), className: "justify-center" }]
          : []),
      ]}
    />
  )
}

/**
 * Where the table is narrow, every filter in one menu, so the toolbar stays one row: a section per filter with its
 * options and counts, and Reset at the end. What's picked shows as chips under the toolbar.
 */
function DataTableFilterMenu<TData extends RowData>({ table, filters }: { table: DataTableInstance<TData>; filters: DataTableFilter[] }) {
  const { t } = useLocale()
  const sections = filters
    .map((filter) => ({ filter, column: table.getColumn(filter.column) }))
    .filter((section) => section.column !== undefined)
  const active = table.state.columnFilters.length

  return (
    <DropdownMenu
      align="end"
      className="w-56"
      trigger={
        // Labelled where the table has room, with the count of filters on; an icon with a dot where it's narrow.
        <Button variant="outline" size="sm" className="relative h-8 @max-xl:w-8 @max-xl:px-0" aria-label={active ? `${t("filters")} (${active})` : t("filters")}>
          <ListFilter aria-hidden />
          <span aria-hidden className="@max-xl:hidden">
            {t("filters")}
          </span>
          {active > 0 && (
            <>
              <Badge color="neutral" className="rounded-sm px-1 font-normal @max-xl:hidden">
                {active}
              </Badge>
              <span aria-hidden className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background @xl:hidden" />
            </>
          )}
        </Button>
      }
      items={[
        ...sections.flatMap(({ filter, column }, i) => {
          const counts = column!.getFacetedUniqueValues()
          const selected = new Set((column!.getFilterValue() as string[] | undefined) ?? [])
          const toggle = (value: string, checked: boolean) => {
            const next = new Set(selected)
            if (checked) next.add(value)
            else next.delete(value)
            column!.setFilterValue(next.size ? [...next] : undefined)
          }
          return [
            ...(i > 0 ? [{ type: "separator" as const }] : []),
            { type: "label" as const, label: filter.title },
            ...filter.options.map((option) => ({
              type: "checkbox" as const,
              checked: selected.has(option.value),
              onCheckedChange: (checked: boolean) => toggle(option.value, checked),
              icon: option.icon && <option.icon className="size-4 text-muted-foreground" />,
              label: (
                <>
                  {option.label}
                  <span className="ms-auto font-mono text-xs text-muted-foreground tabular-nums">{counts.get(option.value) ?? 0}</span>
                </>
              ),
            })),
          ]
        }),
        ...(active > 0 ? [{ type: "separator" as const }, { label: t("reset"), onSelect: () => table.resetColumnFilters(), className: "justify-center" }] : []),
      ]}
    />
  )
}

/**
 * What the filters let through, as chips under the toolbar: the filter's name and the value, each with its own ×, and
 * Reset at the end.
 */
function DataTableActiveFilters<TData extends RowData>({ table, filters }: { table: DataTableInstance<TData>; filters: DataTableFilter[] }) {
  const { t } = useLocale()
  const chips = filters.flatMap((filter) => {
    const column = table.getColumn(filter.column)
    const values = (column?.getFilterValue() as string[] | undefined) ?? []
    return values.map((value) => ({
      filter,
      value,
      label: filter.options.find((option) => option.value === value)?.label ?? value,
      remove: () => {
        const rest = values.filter((other) => other !== value)
        column!.setFilterValue(rest.length ? rest : undefined)
      },
    }))
  })
  if (chips.length === 0) return null

  return (
    <div data-slot="data-table-filters" className="flex items-center gap-2">
      {/* One row as wide as its chips, scrolling sideways when they don't fit, its edges fading while there are more
          that way; Reset stays right after it. */}
      <ScrollShadow as="ul" orientation="horizontal" size={24} aria-label={t("filters")} className="flex min-w-0 items-center gap-1.5">
        {chips.map((chip) => (
          <li
            key={`${chip.filter.column}:${chip.value}`}
            className="inline-flex h-7 shrink-0 animate-in items-center gap-1 rounded-full border bg-card ps-2.5 pe-1 text-[13px] whitespace-nowrap duration-(--duration-fast) ease-enter fade-in-0 zoom-in-95 motion-reduce:animate-none"
          >
            <span>
              <span className="text-muted-foreground">{chip.filter.title}</span> {chip.label}
            </span>
            <button
              type="button"
              aria-label={t("remove", { name: `${chip.filter.title}: ${chip.label}` })}
              onClick={chip.remove}
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
            >
              <X className="size-3" aria-hidden />
            </button>
          </li>
        ))}
      </ScrollShadow>
      <Button
        variant="link"
        color="neutral"
        size="xs"
        className="h-7 shrink-0 text-muted-foreground hover:text-foreground hover:no-underline"
        // The same as the reset icon: the filters and the search go.
        onClick={() => {
          table.resetColumnFilters()
          table.setGlobalFilter("")
        }}
      >
        {t("reset")}
      </Button>
    </div>
  )
}

/**
 * A soft fade at the side of a table that's scrolled sideways, where more columns are hidden: at the end while there's
 * more to see, at the start once it's moved. It follows the reading direction.
 */
function ScrollEdges({ card }: { card: React.RefObject<HTMLElement | null> }) {
  const [edges, setEdges] = React.useState({ start: false, end: false })
  React.useEffect(() => {
    const scroller = card.current?.querySelector<HTMLElement>("[data-slot=table-container]")
    if (!scroller) return
    const update = () => {
      // Right to left, scrollLeft runs from 0 to negative: its size is the distance from the start either way.
      const moved = Math.abs(scroller.scrollLeft)
      const room = scroller.scrollWidth - scroller.clientWidth
      const next = { start: moved > 1, end: room - moved > 1 }
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next))
    }
    update()
    scroller.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild)
    return () => {
      scroller.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [card])
  const fade = "pointer-events-none absolute inset-y-0 z-20 w-8 from-card to-transparent transition-opacity duration-(--duration-fast) ease-standard"
  return (
    <>
      <span aria-hidden className={cn(fade, "start-0 bg-linear-to-r rtl:bg-linear-to-l", edges.start ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(fade, "end-0 bg-linear-to-l rtl:bg-linear-to-r", edges.end ? "opacity-100" : "opacity-0")} />
    </>
  )
}

/** "createdAt" / "created_at" → "Created at" */
function humanize(id: string) {
  const words = id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const formatItems: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  csv: { label: "CSV", icon: <FileText /> },
  xlsx: { label: "Excel", icon: <FileSpreadsheet /> },
}

function DataTableExportMenu<TData extends RowData>({ table, options }: { table: DataTableInstance<TData>; options: DataTableExport<TData> }) {
  const { t } = useLocale()
  const { filename = "export", formats = ["csv", "xlsx"], columns: overrides = {}, extraColumns = [] } = options
  const selected = Object.keys(table.state.rowSelection).length

  const download = (format: ExportFormat) => {
    // Visible data columns (selection and actions columns have no accessor), unless left out.
    const columns = table.getVisibleLeafColumns().filter((column) => column.accessorFn !== undefined && overrides[column.id] !== false)
    const header = [
      ...columns.map((column) => {
        const override = overrides[column.id]
        return (override && override.label) ?? (typeof column.columnDef.header === "string" ? column.columnDef.header : humanize(column.id))
      }),
      ...extraColumns.map((extra) => extra.label),
    ]
    // Every row the search and filters leave, in the current order, across all pages; or just the selected ones.
    const rows = (selected ? table.getSelectedRowModel() : table.getSortedRowModel()).rows.map((row) => [
      ...columns.map((column) => {
        const override = overrides[column.id]
        const value = override && override.value ? override.value(row.original) : row.getValue(column.id)
        return value === null || value === undefined || value instanceof Date || ["string", "number", "boolean"].includes(typeof value)
          ? (value as ExportCell)
          : String(value)
      }),
      ...extraColumns.map((extra) => extra.value(row.original)),
    ])
    const today = new Date()
    const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    exportRows(format, [header, ...rows], `${filename}-${stamp}`)
  }

  return (
    <DropdownMenu
      align="end"
      className="w-48"
      trigger={
        // Icon only where the table is narrow; the label is still read out.
        <Button variant="outline" size="sm" className="h-8 @max-xl:w-8 @max-xl:px-0">
          <Download aria-hidden /> <span className="@max-xl:sr-only">{t("export")}</span>
          <ChevronDown className="text-muted-foreground @max-xl:hidden" aria-hidden />
        </Button>
      }
      items={[
        // The formats, as in every export menu; with rows selected, a heading says only those go.
        ...(selected ? [{ type: "label" as const, label: t("exportSelected", { count: selected }) }, { type: "separator" as const }] : []),
        ...formats.map((format) => ({ ...formatItems[format], onSelect: () => download(format) })),
      ]}
    />
  )
}

function DataTableViewOptions<TData extends RowData>({ table }: { table: DataTableInstance<TData> }) {
  const { t } = useLocale()
  // Only data columns can be toggled — display columns (selection, actions) always stay.
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.accessorFn !== undefined && column.getCanHide())

  return (
    <DropdownMenu
      align="end"
      className="w-44"
      trigger={
        // Icon only where the table is narrow; the label is still read out.
        <Button variant="outline" size="sm" className="h-8 @max-xl:w-8 @max-xl:px-0">
          <Settings2 aria-hidden /> <span className="@max-xl:sr-only">{t("columns")}</span>
        </Button>
      }
      items={[
        { type: "label", label: t("toggleColumns") },
        { type: "separator" },
        ...columns.map((column) => ({
          type: "checkbox" as const,
          checked: column.getIsVisible(),
          onCheckedChange: (value: boolean) => column.toggleVisibility(value),
          label: typeof column.columnDef.header === "string" ? column.columnDef.header : humanize(column.id),
        })),
      ]}
    />
  )
}

function DataTablePagination<TData extends RowData>({
  table,
  pageSizes,
  selectable,
}: {
  table: DataTableInstance<TData>
  pageSizes: number[]
  selectable: boolean
}) {
  const { t } = useLocale()
  const { pageIndex, pageSize } = table.state.pagination
  const selectedCount = Object.keys(table.state.rowSelection).length
  const filteredCount = table.getFilteredRowModel().rows.length
  const pageCount = Math.max(table.getPageCount(), 1)

  return (
    // One row however narrow the table: the count at the start, the page and its buttons at the end. Rows per page,
    // and the first and last page buttons, join them where the table has room.
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 text-sm text-muted-foreground">
      <p aria-live="polite">
        {selectable && selectedCount > 0
          ? t("rowsSelected", { selected: selectedCount, total: t("rows", { count: filteredCount }) })
          : t("rows", { count: filteredCount })}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 @xl:gap-x-6">
        <div className="flex items-center gap-2 @max-xl:hidden">
          <span className="whitespace-nowrap">{t("rowsPerPage")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
            options={pageSizes.map(String)}
            size="sm"
            side="top"
            aria-label={t("rowsPerPage")}
            className="w-[4.5rem]"
          />
        </div>
        <div className="flex items-center gap-3">
        <span className="whitespace-nowrap tabular-nums">
          {t("pageOf", { page: pageIndex + 1, total: pageCount })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden @xl:inline-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label={t("firstPage")}
          >
            <ChevronsLeft className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t("previousPage")}
          >
            <ChevronLeft className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t("nextPage")}
          >
            <ChevronRight className="rtl:-scale-x-100" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden @xl:inline-flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label={t("lastPage")}
          >
            <ChevronsRight className="rtl:-scale-x-100" />
          </Button>
        </div>
        </div>
      </div>
    </div>
  )
}

/**
 * The rows of a virtual Data Table: all of them in one scrolling box, drawn only where they're in view (plus a few
 * around), with the header pinned on top and the count under it. Columns keep the widths they first take, so they
 * don't jump as different rows scroll by; they're measured again when the box or the columns change.
 */
function DataTableVirtualBody<TData extends RowData>({
  table,
  height,
  emptyRow,
  selectable,
  onLoadMore,
  hasMore,
  totalRows,
  footer,
}: {
  table: DataTableInstance<TData>
  height: number
  emptyRow: React.ReactNode
  selectable: boolean
  onLoadMore?: () => Promise<void> | void
  hasMore: boolean
  totalRows?: number
  footer?: DataTableProps<TData>["footer"]
}) {
  const { t } = useLocale()
  const rows = table.getPrePaginatedRowModel().rows
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const headerRef = React.useRef<HTMLTableRowElement>(null)
  const columnCount = table.getVisibleLeafColumns().length
  const loader = onLoadMore !== undefined && hasMore

  // TanStack Virtual hands back new values on every scroll, so the compiler leaves this component as it is.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length + (loader ? 1 : 0),
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 41,
    overscan: 12,
  })
  const items = virtualizer.getVirtualItems()
  const total = virtualizer.getTotalSize()
  const top = items[0]?.start ?? 0
  const bottom = total - (items.at(-1)?.end ?? 0)

  const lastIndex = items.at(-1)?.index ?? 0
  const { status, retry } = useLoadMore({ near: loader && lastIndex >= rows.length - 8, count: rows.length, hasMore, onLoadMore })

  // The header's height, so the footer counts only the rows below it as in view.
  const [headerHeight, setHeaderHeight] = React.useState(40)
  React.useLayoutEffect(() => {
    if (headerRef.current) setHeaderHeight(headerRef.current.getBoundingClientRect().height)
  }, [])

  // The column widths, measured from the header once the first rows are drawn, then held.
  const [widths, setWidths] = React.useState<number[] | null>(null)
  const columnsKey = table.getVisibleLeafColumns().map((column) => column.id).join(" ")
  const [shownColumns, setShownColumns] = React.useState(columnsKey)
  if (shownColumns !== columnsKey) {
    setShownColumns(columnsKey)
    setWidths(null)
  }
  React.useLayoutEffect(() => {
    // Only once body rows are drawn: on the very first render the box isn't measured yet and there are none.
    if (widths || !headerRef.current || !scrollRef.current || items.length === 0) return
    // Measured at their natural widths (the table drawn as wide as its content), then the room left shared out in
    // proportion, so no column takes all the slack while another is cut short. Before paint, so it never shows.
    const natural = [...headerRef.current.children].map((cell) => (cell as HTMLElement).getBoundingClientRect().width)
    const sum = natural.reduce((a, b) => a + b, 0)
    const room = scrollRef.current.clientWidth
    setWidths(sum > 0 && sum < room ? natural.map((width) => (width * room) / sum) : natural)
  }, [widths, items.length])
  React.useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    let width = scroller.clientWidth
    const observer = new ResizeObserver(() => {
      if (Math.abs(scroller.clientWidth - width) < 1) return
      width = scroller.clientWidth
      setWidths(null)
    })
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [])

  // A new search, filter or sort starts from the top.
  const viewKey = JSON.stringify([table.state.globalFilter ?? "", table.state.columnFilters, table.state.sorting])
  const lastViewKey = React.useRef(viewKey)
  React.useEffect(() => {
    if (viewKey === lastViewKey.current) return
    lastViewKey.current = viewKey
    scrollRef.current?.scrollTo({ top: 0 })
  }, [viewKey])

  const selectedCount = Object.keys(table.state.rowSelection).length
  const cardRef = React.useRef<HTMLDivElement>(null)
  // How many rows are loaded (before the search and filters), for the footer.
  const loaded = table.getCoreRowModel().rows.length
  // The rows in view: those whose middle is below the pinned header and above the box's bottom edge.
  const scrolled = virtualizer.scrollOffset ?? 0
  const inView = items.filter((item) => {
    if (item.index >= rows.length) return false
    const middle = headerHeight + item.start + item.size / 2 - scrolled
    return middle > headerHeight && middle < height
  })
  const first = (inView[0]?.index ?? -1) + 1
  const last = (inView.at(-1)?.index ?? -1) + 1
  // All of them: totalRows on your server while more can load, else everything loaded.
  const all = onLoadMore && hasMore && totalRows !== undefined ? totalRows : loaded
  const summary =
    onLoadMore && hasMore && totalRows === undefined
      ? rows.length < loaded
        ? t("showingRowsOf", { shown: rows.length, count: loaded })
        : t("rowsMore", { count: loaded })
      : rows.length < all
        ? t("showingRowsOf", { shown: rows.length, count: all })
        : t("rows", { count: all })

  return (
    <>
      <div ref={cardRef} className="relative overflow-hidden rounded-lg border bg-card text-card-foreground">
        <ScrollEdges card={cardRef} />
        {/* The box scrolls both ways and can take focus, so the arrow keys and Page Down scroll it. */}
        <div
          ref={scrollRef}
          data-slot="table-container"
          tabIndex={0}
          style={{ height }}
          className="relative overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          <table
            data-slot="table"
            aria-rowcount={rows.length + 1}
            className={cn("caption-bottom text-sm", widths ? "w-full table-fixed" : "w-max")}
          >
            {widths && (
              <colgroup>
                {widths.map((width, i) => (
                  <col key={i} style={{ width }} />
                ))}
              </colgroup>
            )}
            {/* Pinned on top; a shadow draws its edge, as a border doesn't stay with a pinned header. */}
            <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_var(--border)] [&_tr]:border-b-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} ref={headerRef} aria-rowindex={1} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                        className="first:ps-4"
                      >
                        {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                emptyRow
              ) : (
                <>
                  {top > 0 && <tr aria-hidden style={{ height: top }} />}
                  {items.map((item) => {
                    if (item.index >= rows.length)
                      return (
                        <tr key="more" data-index={item.index} ref={virtualizer.measureElement} className="hover:bg-transparent">
                          <td colSpan={columnCount} className="p-2 text-center text-sm text-muted-foreground">
                            {status === "error" ? (
                              <span role="alert" className="inline-flex items-center gap-2">
                                {t("loadMoreFailed")}
                                <Button variant="outline" size="xs" onClick={retry}>
                                  {t("tryAgain")}
                                </Button>
                              </span>
                            ) : (
                              <span className="inline-flex h-7 items-center gap-2">
                                <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                {t("loadingMore")}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    const row = rows[item.index]!
                    return (
                      <TableRow
                        key={row.id}
                        data-index={item.index}
                        ref={virtualizer.measureElement}
                        aria-rowindex={item.index + 2}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className={cn("first:ps-4", widths && "overflow-hidden text-ellipsis")}>
                            <table.FlexRender cell={cell} />
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                  {bottom > 0 && <tr aria-hidden style={{ height: bottom }} />}
                </>
              )}
            </TableBody>
          </table>
        </div>
      </div>
      {footer === undefined ? (
        // One line at the end: how many rows there are out of all of them (all the loaded ones, or totalRows on your
        // server while more can load), with the selection at the start when there is one. Announced as it changes.
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-1 px-1 text-sm text-muted-foreground">
          {selectable && selectedCount > 0 && <p className="me-auto tabular-nums">{t("selectedCount", { count: selectedCount })}</p>}
          <p aria-live="polite" className="tabular-nums">
            {summary}
          </p>
        </div>
      ) : (
        footer !== false &&
        footer({ table, rows: rows.length, loaded, range: first > 0 ? { start: first, end: last } : null, selected: selectedCount, hasMore, totalRows })
      )}
    </>
  )
}

export type DataTableExport<TData extends RowData> = {
  /** Without an extension; the date is added, e.g. "orders-2026-10-15.xlsx". */
  filename?: string
  /** The formats offered, in this order. */
  formats?: ExportFormat[]
  /**
   * Per column id: a heading and a value for the file (e.g. a number instead of the formatted text the cell shows),
   * or false to leave the column out. By default every visible data column, with its raw value.
   */
  columns?: Record<string, false | { label?: string; value?: (row: TData) => ExportCell }>
  /** Columns only in the file, after the table's, e.g. an email the table shows under the name. */
  extraColumns?: { label: string; value: (row: TData) => ExportCell }[]
}

/** What a custom footer gets: the counts the built-in one shows, worked out, and the table for anything else. */
export type DataTableFooterInfo<TData extends RowData> = {
  table: DataTableInstance<TData>
  /** Rows the search and filters leave. */
  rows: number
  /** Rows loaded (in data), before the search and filters. */
  loaded: number
  /** With virtual: the rows in view, 1-based; null when there are none. */
  range: { start: number; end: number } | null
  selected: number
  /** With onLoadMore: whether more can load, and totalRows as given. */
  hasMore: boolean
  totalRows?: number
}

export type DataTableProps<TData extends RowData> = {
  columns: DataTableColumnDef<TData>[]
  data: TData[]
  /** Stable row id — required for selection to survive sorting and paging. */
  getRowId?: (row: TData) => string
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  pageSizes?: number[]
  /** Extra toolbar content, e.g. bulk actions for selected rows. */
  toolbar?: (table: DataTableInstance<TData>) => React.ReactNode
  /**
   * An Export menu (CSV, Excel) in the toolbar. It exports the rows the search, filters and sorting leave (all pages)
   * or the selected ones, with the visible columns.
   */
  exportable?: boolean | DataTableExport<TData>
  emptyMessage?: string
  /**
   * Back to the first page whenever the rows change (the default). Turn it off when rows are edited in place, e.g. a
   * count typed into a cell: the page stays. The search and filters still start from the first page either way.
   */
  autoResetPage?: boolean
  /**
   * Scroll through every row instead of paging: only the rows in view are drawn, so tens of thousands (logs, an audit
   * trail) stay smooth. The header stays put while the rows scroll under it.
   */
  virtual?: boolean
  /** With virtual: the table's height in pixels, header included. */
  height?: number
  /** With virtual: called as the last rows come into view, to fetch the next ones and add them to data. */
  onLoadMore?: () => Promise<void> | void
  /** With onLoadMore: false once there's nothing more to load. */
  hasMore?: boolean
  /** With onLoadMore: how many rows there are in all (on your server), so the footer says how much is loaded. */
  totalRows?: number
  /**
   * The line under the table: false hides it, a function draws your own from the counts. By default it's the count
   * and the pages, or with virtual the rows in view and how much is loaded. Its words come from LocaleProvider.
   */
  footer?: false | ((info: DataTableFooterInfo<TData>) => React.ReactNode)
  className?: string
}

const defaultPageSizes = [10, 20, 50]

/** A client-side data table: search, faceted filters, sorting, column visibility, selection and pagination. */
export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  searchPlaceholder,
  filters = [],
  pageSizes = defaultPageSizes,
  toolbar,
  exportable = false,
  emptyMessage,
  autoResetPage = true,
  virtual = false,
  height = 480,
  onLoadMore,
  hasMore = true,
  totalRows,
  footer,
  className,
}: DataTableProps<TData>) {
  const { t } = useLocale()
  const searchLabel = searchPlaceholder ?? t("searchTable")
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: pageSizes[0] ?? 10 } },
    autoResetPageIndex: autoResetPage,
  })

  // With autoResetPage off, the table resets the page itself where it still should: a new search or filter starts
  // from the first page, and a page the rows no longer reach falls back to the last one.
  const filterKey = autoResetPage ? "" : JSON.stringify([table.state.columnFilters, table.state.globalFilter ?? ""])
  const lastFilterKey = React.useRef(filterKey)
  const { pageIndex } = table.state.pagination
  const pageCount = table.getPageCount()
  React.useEffect(() => {
    if (autoResetPage) return
    if (filterKey !== lastFilterKey.current) {
      lastFilterKey.current = filterKey
      table.setPageIndex(0)
    } else if (pageCount > 0 && pageIndex > pageCount - 1) table.setPageIndex(pageCount - 1)
  }, [autoResetPage, filterKey, pageIndex, pageCount, table])

  const cardRef = React.useRef<HTMLDivElement>(null)
  const selectable = columns.some((column) => column.id === "select")
  const isFiltered = table.state.columnFilters.length > 0 || Boolean(table.state.globalFilter)

  const emptyRow = (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={table.getVisibleLeafColumns().length} className="py-10 text-center whitespace-normal">
          {/* An empty state: what happened and, after a search or filter, the way back. */}
          <div className="flex animate-in flex-col items-center gap-3 fade-in-0 blur-in-[3px] duration-(--duration-standard) ease-enter motion-reduce:animate-none">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-5" />
            </span>
            <p className="text-sm font-medium">{emptyMessage ?? t("noRows")}</p>
            {isFiltered && (
              <>
                <p className="-mt-2 text-sm text-muted-foreground">{t("tryAnother")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    table.resetColumnFilters()
                    table.setGlobalFilter("")
                  }}
                >
                  {t("clearFilters")}
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
  )

  return (
    // The toolbar and the footer follow the table's own width (a container query), not the screen's: a table in a narrow
    // card gets the compact toolbar on a wide screen too.
    <div className={cn("@container w-full min-w-0 space-y-4", className)}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            prefix={<Search aria-hidden />}
            value={(table.state.globalFilter as string | undefined) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            // Where the table is narrower than 42rem the search fills the row beside the icon buttons (and never pushes
            // them onto a row of their own); wider, it gives way to the filter buttons first, between 10rem and 16rem.
            className="h-8 min-w-0 flex-1 @2xl:max-w-64 @2xl:min-w-40"
          />
          {/* Where the table is wide, each filter is a button of its own; narrower, they're one Filters menu. Reset is
              at the end of the chips under the toolbar. */}
          <div className="contents @max-2xl:hidden">
            {filters.map((filter) => (
              <DataTableFacetedFilter key={filter.column} table={table} filter={filter} />
            ))}
          </div>
          {filters.length > 0 && (
            <div className="@2xl:hidden">
              <DataTableFilterMenu table={table} filters={filters} />
            </div>
          )}
          {/* Actions always at the end: export and columns, then your own (e.g. New) last. */}
          <div className="ms-auto flex items-center gap-2">
            {exportable && <DataTableExportMenu table={table} options={exportable === true ? {} : exportable} />}
            <DataTableViewOptions table={table} />
            {toolbar?.(table)}
          </div>
        </div>
        <DataTableActiveFilters table={table} filters={filters} />
      </div>

      {virtual ? (
        <DataTableVirtualBody
          table={table}
          height={height}
          emptyRow={emptyRow}
          selectable={selectable}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          totalRows={totalRows}
          footer={footer}
        />
      ) : (
        <>
          {/* A card of its own, so the table stands out on the page; the table inside scrolls sideways when it must. */}
          <div ref={cardRef} className="relative overflow-hidden rounded-lg border bg-card text-card-foreground">
            <ScrollEdges card={cardRef} />
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted()
                      return (
                        <TableHead
                          key={header.id}
                          aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                          className="first:ps-4"
                        >
                          {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="first:ps-4">
                          <table.FlexRender cell={cell} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  emptyRow
                )}
              </TableBody>
            </Table>
          </div>

          {footer === undefined ? (
            <DataTablePagination table={table} pageSizes={pageSizes} selectable={selectable} />
          ) : (
            footer !== false &&
            footer({
              table,
              rows: table.getFilteredRowModel().rows.length,
              loaded: table.getCoreRowModel().rows.length,
              range: null,
              selected: Object.keys(table.state.rowSelection).length,
              hasMore,
              totalRows,
            })
          )}
        </>
      )}
    </div>
  )
}
