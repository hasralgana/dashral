"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { type FieldClassNames, type FieldOwnProps } from "./field"
import { Input } from "./input"
import { PopoverAnchor, PopoverContent, PopoverRoot } from "./popover"

type AutocompleteSuggestion = string | { value: string; description?: string; icon?: React.ReactNode }

type AutocompleteProps = FieldOwnProps &
  Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "onSelect" | "prefix" | "list"> & {
    /** The text, controlled. Anything can be typed; a suggestion only fills it in. */
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    /** What it suggests: strings, or { value, description, icon }. */
    suggestions: AutocompleteSuggestion[]
    /** Called when a suggestion is picked (not on every keystroke), e.g. to add a tag and clear the field. */
    onSelect?: (value: string) => void
    /** Narrows the suggestions to those containing the text, ignoring case and accents. false: they're shown as given, for a search of your own (fetch as onValueChange fires). */
    filter?: boolean
    /** A spinner in the list while your suggestions load. */
    loading?: boolean
    /** At most this many in the list. */
    limit?: number
    prefix?: React.ReactNode
    suffix?: React.ReactNode
    classNames?: FieldClassNames & { wrapper?: string; input?: string; content?: string; option?: string }
  }

/** Lowercase without accents, so "cafe" finds "Café". */
const fold = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

/** The suggestion with the typed part in bold. */
function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? fold(text).indexOf(fold(query)) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-foreground">{text.slice(at, at + query.length)}</strong>
      {text.slice(at + query.length)}
    </>
  )
}

/**
 * A text field that suggests as you type, in one tag: `<Autocomplete label="City" suggestions={cities} />`. Unlike
 * Combobox, any text is a valid answer; the suggestions only save typing. The arrow keys move through them and Enter
 * picks one, while the focus stays in the field. Takes label, description and error like Input.
 */
function Autocomplete({
  value,
  defaultValue = "",
  onValueChange,
  suggestions,
  onSelect,
  filter = true,
  loading = false,
  limit = 8,
  className,
  classNames,
  onKeyDown,
  onFocus,
  onBlur,
  ...props
}: AutocompleteProps) {
  const { t } = useLocale()
  const listId = React.useId()
  const [internal, setInternal] = React.useState(defaultValue)
  const text = value ?? internal
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const field = React.useRef<HTMLInputElement>(null)

  const all = suggestions.map((s) => (typeof s === "string" ? { value: s } : s))
  const needle = fold(text.trim())
  const shown = (filter ? all.filter((s) => fold(s.value).includes(needle) && s.value !== text) : all).slice(0, limit)
  const expanded = open && (shown.length > 0 || loading)

  function change(next: string) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }
  function choose(suggestion: string) {
    change(suggestion)
    onSelect?.(suggestion)
    setOpen(false)
    setActive(-1)
  }

  return (
    <PopoverRoot open={expanded} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          {...props}
          ref={field}
          value={text}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          className={className}
          classNames={classNames}
          onFocus={(event) => {
            setOpen(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setOpen(false)
            setActive(-1)
            onBlur?.(event)
          }}
          onChange={(event) => {
            change(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault()
              setOpen(true)
              const step = event.key === "ArrowDown" ? 1 : -1
              setActive((i) => (shown.length ? (i + step + shown.length) % shown.length : -1))
            } else if (event.key === "Enter" && expanded && active >= 0 && shown[active]) {
              event.preventDefault()
              choose(shown[active].value)
            } else if (event.key === "Escape" && expanded) {
              event.preventDefault()
              event.stopPropagation()
              setOpen(false)
            }
            onKeyDown?.(event)
          }}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn("w-(--radix-popover-trigger-width) min-w-48 p-1", classNames?.content)}
        // The focus stays in the field: the list never takes it.
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        // The field anchors the list rather than triggering it, so Radix would count a press on it as outside and
        // close the list as it opens. The field closes it itself, on blur.
        onInteractOutside={(event) => {
          if (event.target instanceof Node && field.current?.contains(event.target)) event.preventDefault()
        }}
      >
        <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto">
          {shown.map((suggestion, i) => (
            <li
              key={suggestion.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, so the field doesn't blur (and close the list) before the pick lands.
              onMouseDown={(event) => {
                event.preventDefault()
                choose(suggestion.value)
              }}
              onMouseMove={() => active !== i && setActive(i)}
              className={cn(
                "flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground/80 transition-colors duration-(--duration-fast) [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
                i === active && "bg-accent text-accent-foreground",
                classNames?.option
              )}
            >
              {suggestion.icon}
              <span className="grid min-w-0">
                <span className="truncate">
                  <Highlight text={suggestion.value} query={filter ? text.trim() : ""} />
                </span>
                {suggestion.description && <span className="truncate text-xs text-muted-foreground">{suggestion.description}</span>}
              </span>
            </li>
          ))}
          {loading && (
            <li role="presentation" className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 aria-hidden className="size-4 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              {t("loading")}
            </li>
          )}
        </ul>
      </PopoverContent>
    </PopoverRoot>
  )
}

export { Autocomplete, type AutocompleteProps, type AutocompleteSuggestion }
