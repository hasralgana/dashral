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
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Download,
  PlusCircle,
  Search,
  SearchX,
  Settings2,
  X,
} from "lucide-react"

import { exportRows, type ExportCell, type ExportFormat } from "../lib/export"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { DropdownMenu } from "./dropdown-menu"
import { Input } from "./input"
import { Select } from "./select"
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
  return <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(!!value)} aria-label={t(label)} />
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
      className={cn("-ms-3 h-8 data-[state=sorted]:text-foreground", className)}
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

/** "createdAt" / "created_at" → "Created at" */
function humanize(id: string) {
  const words = id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const formatLabels: Record<ExportFormat, string> = { csv: "CSV", xlsx: "Excel (.xlsx)" }

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
        // Icon only on phones; the label is still read out.
        <Button variant="outline" size="sm" className="h-8 max-sm:w-8 max-sm:px-0">
          <Download aria-hidden /> <span className="max-sm:sr-only">{t("export")}</span>
        </Button>
      }
      items={[
        { type: "label", label: selected ? t("exportSelected", { count: selected }) : t("exportAll") },
        { type: "separator" },
        ...formats.map((format) => ({ label: formatLabels[format], onSelect: () => download(format) })),
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
        // Icon only on phones; the label is still read out.
        <Button variant="outline" size="sm" className="h-8 max-sm:w-8 max-sm:px-0">
          <Settings2 aria-hidden /> <span className="max-sm:sr-only">{t("columns")}</span>
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
    // On a phone: the count on its own line, then rows per page at the left and the page and its buttons at the right.
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-1 text-sm text-muted-foreground">
      <p aria-live="polite">
        {selectable && selectedCount > 0
          ? t("rowsSelected", { selected: selectedCount, total: t("rows", { count: filteredCount }) })
          : t("rows", { count: filteredCount })}
      </p>
      <div className="flex items-center gap-x-3 gap-y-2 max-sm:w-full max-sm:justify-between sm:gap-x-6">
        <div className="flex items-center gap-2">
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
            className="hidden sm:inline-flex"
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
            className="hidden sm:inline-flex"
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
  })

  const selectable = columns.some((column) => column.id === "select")
  const isFiltered = table.state.columnFilters.length > 0 || Boolean(table.state.globalFilter)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          prefix={<Search aria-hidden />}
          value={(table.state.globalFilter as string | undefined) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="h-8 max-sm:w-full sm:w-64"
        />
        {/* Filters on the left, flowing like the rest of the row. */}
        <div className="contents">
          {filters.map((filter) => (
            <DataTableFacetedFilter key={filter.column} table={table} filter={filter} />
          ))}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter("")
              }}
            >
              {t("reset")} <X />
            </Button>
          )}
        </div>
        {/* Actions always at the right, on every screen (on a row of their own when the filters fill one): export and
            columns, then your own (e.g. New) last. */}
        <div className="ms-auto flex items-center gap-2">
          {exportable && <DataTableExportMenu table={table} options={exportable === true ? {} : exportable} />}
          <DataTableViewOptions table={table} />
          {toolbar?.(table)}
        </div>
      </div>

      {/* A card of its own, so the table stands out on the page; the table inside scrolls sideways when it must. */}
      <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
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
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} pageSizes={pageSizes} selectable={selectable} />
    </div>
  )
}
