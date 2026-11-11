"use client"

import * as React from "react"

import { tokenizeLines, type CodeTokenKind } from "../lib/code-tokens"
import { cn } from "../lib/utils"
import { CopyButton } from "./copy-button"

type CodeTab = {
  /** The tab's name: "pnpm", "npm", "app.tsx". */
  label: string
  code: string
  language?: string
}

type CodeBlockProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The code, as plain text. */
  code?: string
  /**
   * Shown at the end of the header ("tsx", "bash"), and what the code is colored as: ts, tsx, js, jsx, json, css,
   * html and bash get colors; any other language shows plain.
   */
  language?: string
  /** Colors the code by its language. On by default; false shows it plain. */
  highlight?: boolean
  /** A file name in the header: "app/page.tsx". */
  filename?: string
  /** Several snippets in one block, one at a time, e.g. a command for each package manager. In place of code. */
  tabs?: CodeTab[]
  /** The tab shown first (its label); the first by default. */
  defaultTab?: string
  /** Called with the tab's label when another is picked, e.g. to remember the reader's package manager. */
  onTabChange?: (label: string) => void
  /** Numbers each line. */
  lineNumbers?: boolean
  /** Line numbers (from 1) to mark, e.g. the ones a step changed. */
  highlightLines?: number[]
  /** Long lines wrap instead of scrolling sideways. */
  wrap?: boolean
  /** Scrolls past this height, in pixels or any CSS length. */
  maxHeight?: number | string
  /** The copy button in the corner. On by default. */
  copyable?: boolean
  /**
   * Your own highlighted markup in place of the lines, e.g. from a highlighter run on the server, for a language
   * CodeBlock doesn't color or for exact grammar. code is still what's copied. lineNumbers and highlightLines need the
   * component's own lines, so they're ignored with it.
   */
  children?: React.ReactNode
  classNames?: { header?: string; pre?: string; line?: string }
}

// The colors: only keywords, strings, tags, numbers and comments get one; names and punctuation stay in the text
// color. Each reads a CSS variable, so a site can set its own (--code-keyword, --code-string, --code-tag,
// --code-number, --code-comment); without them these are the defaults, for light and dark.
const tokenColors: Record<CodeTokenKind, string> = {
  keyword: "text-[color:var(--code-keyword,oklch(0.5_0.17_320))] dark:text-[color:var(--code-keyword,oklch(0.78_0.14_320))]",
  string: "text-[color:var(--code-string,oklch(0.48_0.13_155))] dark:text-[color:var(--code-string,oklch(0.8_0.12_155))]",
  tag: "text-[color:var(--code-tag,oklch(0.5_0.16_258))] dark:text-[color:var(--code-tag,oklch(0.78_0.12_255))]",
  number: "text-[color:var(--code-number,oklch(0.55_0.15_55))] dark:text-[color:var(--code-number,oklch(0.82_0.12_70))]",
  comment: "text-[color:var(--code-comment,var(--muted-foreground))] italic",
}

/**
 * Code to read and copy, in one tag: `<CodeBlock filename="app/page.tsx" language="tsx" code={source} lineNumbers />`.
 * A header with the file name or tabs, a copy button, line numbers and marked lines, and the code colored by its
 * language (lib/code-tokens: TypeScript and JavaScript with JSX, JSON, CSS, HTML and shell). For another language,
 * pass your highlighter's output as children. Code always runs left to right, Arabic pages included.
 */
function CodeBlock({
  code: codeProp,
  language: languageProp,
  highlight = true,
  filename,
  tabs,
  defaultTab,
  onTabChange,
  lineNumbers = false,
  highlightLines,
  wrap = false,
  maxHeight,
  copyable = true,
  className,
  classNames,
  children,
  ...props
}: CodeBlockProps) {
  const baseId = React.useId()
  const [tab, setTab] = React.useState(defaultTab ?? tabs?.[0]?.label)
  const activeTab = tabs?.find((t) => t.label === tab) ?? tabs?.[0]
  const code = (activeTab?.code ?? codeProp ?? "").replace(/\n$/, "")
  const language = activeTab?.language ?? languageProp
  const marked = new Set(highlightLines)
  const lines = code.split("\n")
  const colored = highlight && children === undefined ? tokenizeLines(code, language) : null
  const hasHeader = Boolean(filename || tabs?.length || language)
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  function pick(label: string) {
    setTab(label)
    onTabChange?.(label)
  }

  // Tabs pattern: the arrows move between tabs (in reading order), Home and End to the ends.
  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!tabs) return
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl"
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key]
    const next = step !== undefined ? (index + step + tabs.length) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    pick(tabs[next]!.label)
    tabRefs.current[next]?.focus()
  }

  const copy = copyable && <CopyButton value={code} className="shrink-0" />

  return (
    <div
      data-slot="code-block"
      className={cn("group/code relative min-w-0 overflow-hidden rounded-lg border bg-muted/40 text-sm", className)}
      {...props}
    >
      {hasHeader && (
        <div className={cn("flex h-10 items-center gap-2 border-b bg-muted/40 ps-3 pe-1.5", classNames?.header)}>
          {tabs?.length ? (
            <div role="tablist" className="-mb-px flex h-full min-w-0 items-stretch gap-3 overflow-x-auto">
              {tabs.map((t, i) => {
                const selected = t.label === activeTab?.label
                return (
                  <button
                    key={t.label}
                    ref={(node) => {
                      tabRefs.current[i] = node
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${i}`}
                    aria-selected={selected}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => pick(t.label)}
                    onKeyDown={(event) => onTabKeyDown(event, i)}
                    className={cn(
                      "shrink-0 border-b-2 px-0.5 font-mono text-xs outline-none transition-colors focus-visible:text-foreground focus-visible:underline",
                      selected ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
          ) : (
            filename && <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{filename}</span>
          )}
          <span className="ms-auto flex shrink-0 items-center gap-1">
            {language && <span className="px-1.5 font-mono text-[11px] text-muted-foreground uppercase">{language}</span>}
            {copy}
          </span>
        </div>
      )}
      {!hasHeader && copy && (
        // Without a header, the copy button floats in the corner, over the code.
        <span className="absolute end-1.5 top-1.5 z-10 rounded-md bg-muted/80 backdrop-blur-sm">{copy}</span>
      )}
      <pre
        id={tabs?.length ? `${baseId}-panel` : undefined}
        role={tabs?.length ? "tabpanel" : undefined}
        aria-labelledby={tabs?.length ? `${baseId}-tab-${tabs.findIndex((t) => t.label === activeTab?.label)}` : undefined}
        dir="ltr"
        tabIndex={0}
        data-language={language}
        style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
        className={cn(
          "overflow-auto py-3 font-mono text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
          children !== undefined && "px-4",
          !hasHeader && copy && "pe-12",
          classNames?.pre
        )}
      >
        {children !== undefined ? (
          children
        ) : (
          <code className={cn("grid", wrap ? "min-w-0" : "min-w-max")}>
            {lines.map((line, i) => (
              <span
                key={i}
                data-highlighted={marked.has(i + 1) || undefined}
                className={cn(
                  "flex px-4",
                  marked.has(i + 1) && "border-s-2 border-primary bg-primary/8 ps-[14px]",
                  classNames?.line
                )}
              >
                {lineNumbers && (
                  <span
                    aria-hidden
                    style={{ width: `${Math.max(2, String(lines.length).length)}ch` }}
                    className="me-4 inline-block shrink-0 text-end text-muted-foreground/70 select-none tabular-nums"
                  >
                    {i + 1}
                  </span>
                )}
                {/* An empty line still takes its height. */}
                <span className="min-w-0 flex-1">
                  {colored?.[i]?.length
                    ? colored[i]!.map((token, index) =>
                        token.kind ? (
                          <span key={index} className={tokenColors[token.kind]}>
                            {token.text}
                          </span>
                        ) : (
                          token.text
                        )
                      )
                    : line || " "}
                </span>
              </span>
            ))}
          </code>
        )}
      </pre>
    </div>
  )
}

export { CodeBlock, type CodeBlockProps, type CodeTab }
