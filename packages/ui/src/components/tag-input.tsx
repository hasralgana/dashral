"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldError, FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type TagInputControlProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange"> & {
  /** Controlled value. Omit it (and use defaultValue) for an uncontrolled field. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (tags: string[]) => void
  /** At most this many tags; the field stops taking more once it's reached. */
  maxTags?: number
  /** Return an error message to refuse a tag (shown below the field), or null to take it. */
  validate?: (tag: string) => string | null
  /** Characters that finish a tag as you type, besides Enter. Pasted text is split on them too. */
  separators?: string[]
}

type TagInputProps = TagInputControlProps &
  FieldOwnProps & {
    classNames?: FieldClassNames & { box?: string }
  }

/**
 * Free-text tags: type and press Enter or a comma to add one, Backspace in the empty field to take the last one back.
 * Duplicates are ignored, and pasting "a, b, c" adds three.
 */
function TagInput(props: TagInputProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <TagInputControl {...control} />
    </FieldWrapper>
  )
}

function TagInputControl({ classNames, ...controlProps }: TagInputControlProps & { classNames?: TagInputProps["classNames"] }) {
  const {
    value,
    defaultValue = [],
    onValueChange,
    maxTags,
    validate,
    separators = [","],
    placeholder: placeholderProp,
    className,
    disabled,
    id,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
    ...props
  } = useFieldControl(controlProps)
  const { t } = useLocale()
  const placeholder = placeholderProp ?? t("addTag")
  const [internal, setInternal] = React.useState(defaultValue)
  const tags = value ?? internal
  const [draft, setDraft] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const errorId = React.useId()
  const full = maxTags !== undefined && tags.length >= maxTags

  function set(next: string[]) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  /** Adds what's been typed (or pasted); returns whether everything was taken. */
  function add(text: string) {
    const split = new RegExp(`[${separators.map((s) => s.replace(/[\\\]^-]/g, "\\$&")).join("")}\\n]`)
    let next = [...tags]
    for (const raw of text.split(split)) {
      const tag = raw.trim()
      if (!tag || next.some((t) => t.toLowerCase() === tag.toLowerCase())) continue
      if (maxTags !== undefined && next.length >= maxTags) {
        setError(t("tagLimit", { count: maxTags }))
        break
      }
      const problem = validate?.(tag) ?? null
      if (problem) {
        setError(problem)
        set(next)
        return false
      }
      next = [...next, tag]
    }
    set(next)
    return true
  }

  return (
    <div className="grid gap-1.5">
      <div
        data-slot="tag-input"
        data-disabled={disabled || undefined}
        className={cn(
          "flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-1.5 py-1 text-sm shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15 data-disabled:cursor-not-allowed data-disabled:opacity-50",
          "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
          className,
          classNames?.box
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.length > 0 && (
          <ul aria-label={t("tags")} className="contents">
            {tags.map((tag) => (
              <li key={tag} className="inline-flex h-6 items-center gap-0.5 rounded bg-secondary pe-0.5 ps-2 text-xs font-medium text-secondary-foreground">
                {tag}
                <button
                  type="button"
                  aria-label={t("remove", { name: tag })}
                  disabled={disabled}
                  className="flex size-5 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/15"
                  onClick={(event) => {
                    event.stopPropagation()
                    set(tags.filter((t) => t !== tag))
                    inputRef.current?.focus()
                  }}
                >
                  <XIcon className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={draft}
          disabled={disabled || (full && !draft)}
          placeholder={full ? "" : placeholder}
          aria-invalid={error ? true : invalid}
          aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined}
          className="h-7 min-w-24 flex-1 bg-transparent px-1.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          onChange={(event) => {
            setError(null)
            const text = event.target.value
            if (separators.some((s) => text.endsWith(s))) {
              if (add(text)) setDraft("")
            } else setDraft(text)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && draft.trim()) {
              event.preventDefault()
              if (add(draft)) setDraft("")
            } else if (event.key === "Backspace" && !draft && tags.length > 0) {
              event.preventDefault()
              // Put the last tag back in the field to fix it, rather than losing it.
              setDraft(tags.at(-1)!)
              set(tags.slice(0, -1))
            }
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData("text")
            if (!/[\n,]/.test(text) && !separators.some((s) => text.includes(s))) return
            event.preventDefault()
            if (add(draft + text)) setDraft("")
          }}
          onBlur={() => {
            if (draft.trim() && add(draft)) setDraft("")
          }}
          {...props}
        />
      </div>
      {error && (
        <FieldError id={errorId} role="alert">
          {error}
        </FieldError>
      )}
    </div>
  )
}

export { TagInput }
