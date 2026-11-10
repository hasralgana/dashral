"use client"

import * as React from "react"
import { Loader2, PencilIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"

type EditableTextProps = {
  /** The text, controlled. */
  value?: string
  defaultValue?: string
  /**
   * Called with the new text when an edit is saved (Enter, or leaving the field), not on every keystroke. Return a
   * promise to save it somewhere: a spinner shows, and if it rejects, the text goes back and the error shows.
   */
  onValueChange?: (value: string) => void | Promise<unknown>
  /** What the text is, for screen readers: "Project name" makes the button "Edit Project name". Required. */
  label: string
  /** Shown, muted, when the text is empty. */
  placeholder?: string
  /** Empty isn't allowed: an empty edit is refused with a message. */
  required?: boolean
  /** Checks an edit before it's saved: return a message to refuse it, nothing to accept it. */
  validate?: (value: string) => string | undefined
  maxLength?: number
  disabled?: boolean
  /**
   * The text's classes, shared by the text and the field that replaces it (a size, a weight), so switching between
   * them moves nothing: "text-2xl font-semibold" for a title.
   */
  className?: string
  classNames?: { error?: string }
}

/**
 * Text you click to change in place, in one tag: `<EditableText label="Project name" value={name} onValueChange={rename} />`.
 * It looks like text with a pencil on hover; pressed, it becomes a field of the same size and font, with the text
 * selected. Enter or leaving saves, Escape puts it back. An async save shows a spinner and undoes itself on failure.
 */
function EditableText({
  value,
  defaultValue = "",
  onValueChange,
  label,
  placeholder,
  required = false,
  validate,
  maxLength,
  disabled = false,
  className,
  classNames,
}: EditableTextProps) {
  const { t } = useLocale()
  const errorId = React.useId()
  const [internal, setInternal] = React.useState(defaultValue)
  const text = value ?? internal
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(text)
  const [saving, setSaving] = React.useState(false)
  // The edit while it's being saved: shown at once (with the spinner), so it never looks undone while the server answers.
  const [pending, setPending] = React.useState<string | null>(null)
  const shown = pending ?? text
  const [error, setError] = React.useState<string | null>(null)
  const field = React.useRef<HTMLInputElement>(null)
  const button = React.useRef<HTMLButtonElement>(null)
  // Where the focus goes after an edit: back to the text after Enter or Escape, but not after a click elsewhere.
  const returnFocus = React.useRef(false)

  React.useEffect(() => {
    if (editing) field.current?.select()
  }, [editing])
  React.useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false
      button.current?.focus()
    }
  }, [editing])

  function start() {
    if (disabled || saving) return
    setDraft(text)
    setError(null)
    setEditing(true)
  }
  function cancel() {
    returnFocus.current = true
    setError(null)
    setEditing(false)
  }
  async function save(refocus: boolean) {
    const next = draft.trim()
    const problem = required && !next ? t("cantBeEmpty") : validate?.(next)
    if (problem) {
      setError(problem)
      field.current?.focus()
      return
    }
    returnFocus.current = refocus
    setEditing(false)
    if (next === text) return
    const previous = text
    if (value === undefined) setInternal(next)
    const result = onValueChange?.(next)
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setSaving(true)
      setPending(next)
      try {
        await result
      } catch (reason) {
        // Back to what it was, with why.
        if (value === undefined) setInternal(previous)
        setError(reason instanceof Error && reason.message ? reason.message : t("saveFailed"))
      } finally {
        setPending(null)
        setSaving(false)
      }
    }
  }

  // Text and field share one box: the same padding, border width and line height, so nothing shifts between them.
  // The box reaches 0.375rem past each side (-mx-1.5), so its widest is the wrapper's width plus those 0.75rem:
  // max-w-full alone would cut the text short by exactly that much.
  const box = "-mx-1.5 max-w-[calc(100%+0.75rem)] rounded-md border border-transparent px-1.5 py-0.5 leading-[inherit]"

  return (
    <span data-slot="editable-text" className="inline-flex max-w-full min-w-0 flex-col items-start gap-1 align-top">
      {editing ? (
        <input
          ref={field}
          value={draft}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          maxLength={maxLength}
          size={Math.max(4, draft.length + 1)}
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              void save(true)
            } else if (event.key === "Escape") {
              event.preventDefault()
              event.stopPropagation()
              cancel()
            }
          }}
          onBlur={() => {
            // Leaving with a refused edit keeps it open, with its message, rather than losing it.
            if (!error) void save(false)
          }}
          className={cn(
            box,
            "min-w-0 border-ring bg-background font-[inherit] text-[length:inherit] tracking-[inherit] text-inherit shadow-xs ring-2 ring-ring/15 outline-none",
            "animate-in duration-(--duration-fast) ease-standard fade-in-0 motion-reduce:animate-none",
            error && "border-destructive ring-destructive/15",
            className
          )}
        />
      ) : (
        <button
          ref={button}
          type="button"
          disabled={disabled}
          aria-label={`${t("edit")} ${label}`}
          aria-busy={saving || undefined}
          onClick={start}
          className={cn(
            box,
            "group/editable inline-flex min-w-0 items-center gap-2 text-start outline-none transition-colors duration-(--duration-fast)",
            "hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none",
            className
          )}
        >
          <span className={cn("min-w-0 truncate", !shown && "text-muted-foreground")}>{shown || placeholder}</span>
          {saving ? (
            <Loader2 aria-hidden className="size-[0.8em] min-h-3.5 min-w-3.5 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          ) : (
            <PencilIcon
              aria-hidden
              className="size-[0.8em] min-h-3.5 min-w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover/editable:opacity-100 group-focus-visible/editable:opacity-100 pointer-coarse:opacity-100"
            />
          )}
        </button>
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          className={cn(
            "animate-in text-xs text-destructive-text duration-(--duration-standard) ease-enter fade-in-0 slide-in-from-top-1 motion-reduce:animate-none",
            classNames?.error
          )}
        >
          {error}
        </span>
      )}
    </span>
  )
}

export { EditableText, type EditableTextProps }
