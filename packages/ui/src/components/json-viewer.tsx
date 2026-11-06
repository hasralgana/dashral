"use client"

import * as React from "react"
import { ChevronRightIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { CopyButton } from "./copy-button"

type JsonViewerProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** What to show: any value JSON can hold (an object, an array, a string…), or a JSON string, which is parsed. */
  data: unknown
  /** A name for the root, shown as its key: "payload", "response". */
  name?: string
  /** How many levels open at first: 1 opens the root, 0 starts it folded. */
  defaultExpandDepth?: number
  /** Past this many items in one array or object, a "Show N more" button. */
  pageSize?: number
  /** The copy button in the corner, copying the whole value as indented JSON. On by default. */
  copyable?: boolean
  /** Scrolls past this height, in pixels or any CSS length. */
  maxHeight?: number | string
}

type Kind = "object" | "array" | "string" | "number" | "boolean" | "null"

const kindOf = (value: unknown): Kind =>
  value === null || value === undefined ? "null" : Array.isArray(value) ? "array" : typeof value === "object" ? "object" : (typeof value as Kind)

// Each kind of value in its color, all from the theme. Every class is written out in full so Tailwind finds it.
const valueColors: Record<Exclude<Kind, "object" | "array">, string> = {
  string: "text-success-text",
  number: "text-info-text",
  boolean: "text-highlight-text",
  null: "text-muted-foreground italic",
}

type NodeProps = {
  name?: string | number
  value: unknown
  depth: number
  expandDepth: number
  pageSize: number
  last: boolean
}

/** A key (quoted for an object's, plain for an array's index), then a colon. */
function Key({ name }: { name?: string | number }) {
  if (name === undefined) return null
  return (
    <>
      <span className={typeof name === "number" ? "text-muted-foreground" : "text-foreground"}>{typeof name === "number" ? name : JSON.stringify(name)}</span>
      <span className="text-muted-foreground">: </span>
    </>
  )
}

const comma = <span className="text-muted-foreground">,</span>

function JsonNode({ name, value, depth, expandDepth, pageSize, last }: NodeProps) {
  const { t } = useLocale()
  const kind = kindOf(value)
  const [open, setOpen] = React.useState(depth < expandDepth)
  // The children are only built the first time a node opens, so a large payload costs nothing until it's explored;
  // then they stay, so folding it again can animate.
  const [built, setBuilt] = React.useState(open)
  const [shown, setShown] = React.useState(pageSize)

  if (kind !== "object" && kind !== "array") {
    const text = kind === "null" ? "null" : kind === "string" ? JSON.stringify(value) : String(value)
    return (
      <div className="ps-5 break-all">
        <Key name={name} />
        <span className={valueColors[kind]}>{text}</span>
        {!last && comma}
      </div>
    )
  }

  const entries: [string | number, unknown][] = kind === "array" ? (value as unknown[]).map((v, i) => [i, v]) : Object.entries(value as object)
  const [openBrace, closeBrace] = kind === "array" ? ["[", "]"] : ["{", "}"]
  const count = t(kind === "array" ? "jsonItems" : "jsonKeys", { count: entries.length })

  if (entries.length === 0) {
    return (
      <div className="ps-5">
        <Key name={name} />
        <span className="text-muted-foreground">
          {openBrace}
          {closeBrace}
        </span>
        {!last && comma}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setBuilt(true)
          setOpen(!open)
        }}
        className="group/json flex w-full items-start rounded-sm text-start outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <span className="grid h-6 w-5 shrink-0 place-items-center">
          <ChevronRightIcon
            aria-hidden
            className={cn(
              "size-3.5 text-muted-foreground transition-transform duration-(--duration-standard) ease-spring motion-reduce:transition-none",
              open && "rotate-90"
            )}
          />
        </span>
        <span className="min-w-0">
          <Key name={name} />
          <span className="text-muted-foreground">{openBrace}</span>
          {/* Folded: a preview of what's inside, fading in as it closes. */}
          {!open && (
            <span className="animate-in text-muted-foreground duration-(--duration-standard) ease-standard fade-in-0 motion-reduce:animate-none">
              <span className="mx-1">…</span>
              {closeBrace}
              {!last && ","}
              <span className="ms-2 font-sans text-xs">{count}</span>
            </span>
          )}
        </span>
      </button>
      {/* The children grow open and fold shut by their height (grid rows from 0fr to 1fr), fading as they go. */}
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-(--duration-standard) ease-standard motion-reduce:transition-none",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
        inert={!open}
      >
        <div className="min-h-0 overflow-hidden">
          {built && (
            <>
              <div className="ms-2 border-s ps-2">
                {entries.slice(0, shown).map(([key, child], i) => (
                  <JsonNode
                    key={key}
                    name={kind === "array" ? i : key}
                    value={child}
                    depth={depth + 1}
                    expandDepth={expandDepth}
                    pageSize={pageSize}
                    last={i === Math.min(shown, entries.length) - 1 && shown >= entries.length}
                  />
                ))}
                {shown < entries.length && (
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + pageSize)}
                    className="ms-5 rounded-sm font-sans text-xs text-primary-text outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {t("showMore", { count: Math.min(pageSize, entries.length - shown) })}
                  </button>
                )}
              </div>
              <div className="ps-5 text-muted-foreground">
                {closeBrace}
                {!last && ","}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * JSON to read and explore, in one tag: `<JsonViewer data={event.payload} />`. Objects and arrays fold and unfold
 * (with their size shown while folded), each kind of value has its color, long arrays come in pages, and the whole
 * thing copies as indented JSON. For a webhook's body, an API response, a log entry, an audit record.
 */
function JsonViewer({ data, name, defaultExpandDepth = 1, pageSize = 100, copyable = true, maxHeight, className, style, ...props }: JsonViewerProps) {
  const value = React.useMemo(() => {
    if (typeof data !== "string") return data
    try {
      return JSON.parse(data) as unknown
    } catch {
      return data
    }
  }, [data])
  const text = React.useMemo(() => JSON.stringify(value, null, 2) ?? "", [value])

  return (
    <div
      data-slot="json-viewer"
      dir="ltr"
      className={cn("relative min-w-0 overflow-auto rounded-lg border bg-muted/40 py-2 pe-3 ps-1 font-mono text-[13px] leading-6", className)}
      style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight, ...style }}
      {...props}
    >
      {copyable && (
        <span className="sticky top-0 z-10 float-end -me-1.5 -mt-0.5 rounded-md bg-muted/80 backdrop-blur-sm">
          <CopyButton value={text} />
        </span>
      )}
      <JsonNode name={name} value={value} depth={0} expandDepth={defaultExpandDepth} pageSize={pageSize} last />
    </div>
  )
}

export { JsonViewer, type JsonViewerProps }
