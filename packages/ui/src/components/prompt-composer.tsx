"use client"

import * as React from "react"
import { ArrowUp, Paperclip, Square, X } from "lucide-react"

import { accepts, FileThumb, formatBytes } from "../lib/files"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"

/** What the composer sends: the text, trimmed, and the files attached to it. */
type PromptMessage = { text: string; files: File[] }

/** "ready" takes a message; "submitted" (waiting for the first word) and "streaming" turn send into stop. */
type PromptStatus = "ready" | "submitted" | "streaming"

type PromptAttachments = {
  /** Like the `accept` attribute: "image/*", ".pdf,.csv". */
  accept?: string
  maxFiles?: number
  /** Largest file, in bytes. */
  maxSize?: number
}

type PromptComposerProps = FieldOwnProps & {
  /** Controlled text. Omit it (and use defaultValue) and the composer clears itself after sending. */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Controlled attachments; uncontrolled ones clear after sending too. */
  files?: File[]
  defaultFiles?: File[]
  onFilesChange?: (files: File[]) => void
  /** Called with the message when it's sent: Enter, or the send button. */
  onSubmit?: (message: PromptMessage) => void
  /** While a reply is on its way, send becomes stop, and Escape stops too. */
  status?: PromptStatus
  onStop?: () => void
  /** "enter": Enter sends and Shift + Enter adds a line (a chat). "mod-enter": only ⌘/Ctrl + Enter sends. */
  submitOn?: "enter" | "mod-enter"
  /** The longest message; a count shows near it, and past it the message can't be sent. */
  maxLength?: number
  /** Files from the paperclip, pasting or dropping them on the composer. true takes any file. */
  attachments?: boolean | PromptAttachments
  /** Controls at the start of the toolbar, after the paperclip: a model picker, a "search the web" toggle. */
  actions?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autoFocus?: boolean
  id?: string
  name?: string
  /** Names the text box when there's no label. "Message" by default. */
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** Classes for the composer's box. */
  className?: string
  classNames?: FieldClassNames & { composer?: string; textarea?: string; files?: string; toolbar?: string; submit?: string }
}

/** Whether the browser grows a textarea with its content by itself (CSS field-sizing). */
const sizesItself = typeof CSS !== "undefined" && CSS.supports?.("field-sizing", "content")

/**
 * Where a message to an assistant is written: a box that grows as you type, files from the paperclip, a paste or a
 * drop, your own controls in its toolbar, and a send button that turns into stop while the reply streams in.
 */
function PromptComposer(props: PromptComposerProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <PromptComposerControl {...control} />
    </FieldWrapper>
  )
}

function PromptComposerControl({
  value,
  defaultValue = "",
  onValueChange,
  files: filesProp,
  defaultFiles = [],
  onFilesChange,
  onSubmit,
  status = "ready",
  onStop,
  submitOn = "enter",
  maxLength,
  attachments,
  actions,
  placeholder,
  autoFocus,
  name,
  className,
  classNames,
  "aria-label": ariaLabel,
  ...rest
}: Omit<PromptComposerProps, keyof FieldOwnProps>) {
  const { id, disabled, required, ...aria } = useFieldControl<FieldControlProps>({
    id: rest.id,
    disabled: rest.disabled,
    required: rest.required,
    "aria-invalid": rest["aria-invalid"],
  })
  const { t, locale } = useLocale()
  const textarea = React.useRef<HTMLTextAreaElement>(null)
  const picker = React.useRef<HTMLInputElement>(null)

  const [ownText, setOwnText] = React.useState(defaultValue)
  const text = value ?? ownText
  const setText = (next: string) => {
    if (value === undefined) setOwnText(next)
    onValueChange?.(next)
  }
  const [ownFiles, setOwnFiles] = React.useState(defaultFiles)
  const files = filesProp ?? ownFiles
  const setFiles = (next: File[]) => {
    if (filesProp === undefined) setOwnFiles(next)
    onFilesChange?.(next)
  }

  const rules: PromptAttachments | null = attachments ? (attachments === true ? {} : attachments) : null
  const [refused, setRefused] = React.useState<string[]>([])
  const [dragging, setDragging] = React.useState(false)

  const busy = status !== "ready"
  const left = maxLength === undefined ? Infinity : maxLength - text.length
  const hasContent = text.trim().length > 0 || files.length > 0
  const canSend = !disabled && !busy && hasContent && left >= 0
  // The count stays quiet until the last tenth (at least 20 characters), then counts down; past the limit it's red.
  const showCount = maxLength !== undefined && left <= Math.max(20, Math.round(maxLength / 10))

  // Browsers without field-sizing grow the box here instead; its max height still caps it, and it then scrolls.
  React.useLayoutEffect(() => {
    const el = textarea.current
    if (sizesItself || !el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight + (el.offsetHeight - el.clientHeight)}px`
  }, [text])

  function addFiles(list: File[]) {
    if (!rules || !list.length) return
    const problems: string[] = []
    const next = [...files]
    for (const file of list) {
      if (!accepts(file, rules.accept)) problems.push(t("fileType", { name: file.name }))
      else if (rules.maxSize !== undefined && file.size > rules.maxSize) problems.push(t("fileSize", { name: file.name, size: formatBytes(rules.maxSize, locale) }))
      else if (rules.maxFiles !== undefined && next.length >= rules.maxFiles) problems.push(t("fileLimit", { name: file.name, count: rules.maxFiles }))
      else next.push(file)
    }
    setRefused(problems)
    if (next.length !== files.length) setFiles(next)
  }

  function send() {
    if (!canSend) return
    onSubmit?.({ text: text.trim(), files })
    if (value === undefined) setOwnText("")
    if (filesProp === undefined) setOwnFiles([])
    setRefused([])
    textarea.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // A word still being composed (Japanese, Chinese, Korean input) takes its own Enter.
    if (event.nativeEvent.isComposing) return
    if (event.key === "Escape" && busy && onStop) {
      event.preventDefault()
      onStop()
      return
    }
    if (event.key !== "Enter") return
    const mod = event.metaKey || event.ctrlKey
    const sends = submitOn === "enter" ? !event.shiftKey : mod
    if (!sends) return
    event.preventDefault()
    send()
  }

  const countLabel = left >= 0 ? t("charactersLeft", { count: left }) : t("charactersOver", { count: -left })

  return (
    <div
      data-slot="prompt-composer"
      data-disabled={disabled || undefined}
      data-dragging={dragging || undefined}
      data-status={status}
      // A click on the box's empty parts writes in it, as a text field would.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault()
          textarea.current?.focus()
        }
      }}
      onDragOver={(event) => {
        if (!rules || disabled || !event.dataTransfer.types.includes("Files")) return
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
      }}
      onDrop={(event) => {
        if (!rules || disabled) return
        event.preventDefault()
        setDragging(false)
        addFiles([...event.dataTransfer.files])
      }}
      className={cn(
        "relative flex w-full cursor-text flex-col rounded-xl border border-input bg-card shadow-xs transition-[border-color,box-shadow] duration-(--duration-fast)",
        "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15",
        "has-[textarea[aria-invalid=true]]:border-destructive has-[textarea[aria-invalid=true]]:ring-destructive/15",
        "data-[dragging]:border-primary data-[dragging]:ring-2 data-[dragging]:ring-primary/20",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60",
        className,
        classNames?.composer
      )}
    >
      {files.length > 0 && (
        <ul aria-label={t("attachments")} className={cn("flex flex-wrap gap-2 px-3 pt-3", classNames?.files)}>
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className="flex max-w-56 items-center gap-2 rounded-lg border bg-background py-1 ps-1 pe-1.5">
              <FileThumb file={file} className="size-8" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium" dir="auto">
                  {file.name}
                </span>
                <span className="block text-[11px] text-muted-foreground tabular-nums">{formatBytes(file.size, locale)}</span>
              </span>
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                disabled={disabled}
                aria-label={t("remove", { name: file.name })}
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        ref={textarea}
        data-slot="prompt-composer-textarea"
        id={id}
        name={name}
        rows={1}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
        onPaste={(event) => {
          const pasted = [...event.clipboardData.files]
          if (!rules || !pasted.length) return
          event.preventDefault()
          addFiles(pasted)
        }}
        placeholder={placeholder ?? t("askAnything")}
        disabled={disabled}
        required={required}
        autoFocus={autoFocus}
        enterKeyHint={submitOn === "enter" ? "send" : "enter"}
        aria-label={ariaLabel ?? (aria["aria-labelledby"] ? undefined : t("message"))}
        {...aria}
        aria-invalid={aria["aria-invalid"] ?? (left < 0 || undefined)}
        className={cn(
          "field-sizing-content max-h-60 min-h-12 w-full resize-none overflow-y-auto bg-transparent [overflow-wrap:anywhere] px-4 pt-3 pb-1 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm",
          classNames?.textarea
        )}
      />

      {refused.length > 0 && (
        <ul role="alert" className="grid gap-0.5 px-4 pt-1 text-xs text-destructive-text">
          {refused.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {/* Quiet controls (muted until hovered or pressed), so the message and the send button lead; ghost buttons and a
          borderless select in `actions` take this color too. */}
      <div data-slot="prompt-composer-toolbar" className={cn("flex items-center gap-1 p-2 text-muted-foreground", classNames?.toolbar)}>
        {rules && (
          <>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t("attachFiles")} onClick={() => picker.current?.click()} disabled={disabled}>
              <Paperclip />
            </Button>
            <input
              ref={picker}
              type="file"
              tabIndex={-1}
              aria-hidden
              hidden
              multiple={rules.maxFiles !== 1}
              accept={rules.accept}
              onChange={(event) => {
                addFiles([...(event.target.files ?? [])])
                event.target.value = ""
              }}
            />
          </>
        )}
        {actions}
        <span className="ms-auto" />
        {maxLength !== undefined && (
          <span
            className={cn(
              "px-1 text-xs tabular-nums transition-opacity duration-(--duration-fast)",
              showCount ? "opacity-100" : "opacity-0",
              left < 0 ? "text-destructive-text" : "text-muted-foreground"
            )}
          >
            <span aria-hidden>{left}</span>
            <span className="sr-only" aria-live="polite">
              {showCount ? countLabel : ""}
            </span>
          </span>
        )}
        {busy ? (
          <Button
            type="button"
            size="icon-sm"
            className={cn("rounded-full", classNames?.submit)}
            onClick={onStop}
            disabled={!onStop}
            aria-label={t("stopGenerating")}
          >
            <Square aria-hidden className="size-3 fill-current" />
          </Button>
        ) : (
          <Button type="button" size="icon-sm" className={cn("rounded-full", classNames?.submit)} onClick={send} disabled={!canSend} aria-label={t("sendMessage")}>
            <ArrowUp aria-hidden />
          </Button>
        )}
      </div>

      {dragging && (
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center rounded-[inherit] bg-card/85 text-sm font-medium text-primary-text backdrop-blur-[1px]">
          {t("dropToAttach")}
        </div>
      )}
    </div>
  )
}

export { PromptComposer, type PromptComposerProps, type PromptMessage, type PromptStatus, type PromptAttachments }
