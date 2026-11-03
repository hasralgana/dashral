"use client"

import * as React from "react"
import { UploadCloudIcon, XIcon } from "lucide-react"

import { acceptLabel, accepts, FileThumb, formatBytes } from "../lib/files"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, joinIds, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"

type FileDropzoneProps = FieldOwnProps & {
  /** Controlled list of files. Omit it (and use defaultValue) for an uncontrolled dropzone. */
  value?: File[]
  defaultValue?: File[]
  onValueChange?: (files: File[]) => void
  /** Like the `accept` attribute: "image/*", ".pdf,.docx", "image/png,image/jpeg". */
  accept?: string
  multiple?: boolean
  maxFiles?: number
  /** Largest file, in bytes. */
  maxSize?: number
  disabled?: boolean
  required?: boolean
  /** The main line inside the drop area, e.g. "Drop your logo here". */
  title?: React.ReactNode
  /** false hides the list of picked files, to show your own (e.g. with upload progress). */
  showFiles?: boolean
  /** The line under it, inside the drop area; by default it says what's accepted and how big. */
  hint?: React.ReactNode
  id?: string
  name?: string
  /** Classes for the drop area and the list of files under it. */
  className?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  classNames?: FieldClassNames & { dropzone?: string; files?: string }
}

/**
 * Drop files on it, or click (or press Enter / Space) to pick them. Checks type, size and count in the browser and
 * says what it turned down; the files themselves go wherever `onValueChange` sends them.
 */
function FileDropzone(props: FileDropzoneProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <FileDropzoneControl {...control} />
    </FieldWrapper>
  )
}

function FileDropzoneControl({
  value,
  defaultValue = [],
  onValueChange,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  title,
  hint: hintProp,
  showFiles = true,
  classNames,
  name,
  className,
  ...rest
}: Omit<FileDropzoneProps, keyof FieldOwnProps | "required">) {
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const { t, locale } = useLocale()
  const [internal, setInternal] = React.useState(defaultValue)
  const files = value ?? internal
  const [dragging, setDragging] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hintId = React.useId()
  const limit = multiple ? (maxFiles ?? Infinity) : 1

  function set(next: File[]) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  function add(list: FileList | null) {
    if (!list || disabled) return
    const problems: string[] = []
    // One file at a time replaces the current one; otherwise new files are added up to the limit.
    let next = multiple ? [...files] : []
    for (const file of Array.from(list)) {
      if (!accepts(file, accept)) problems.push(t("fileType", { name: file.name }))
      else if (maxSize !== undefined && file.size > maxSize) problems.push(t("fileSize", { name: file.name, size: formatBytes(maxSize, locale) }))
      else if (next.length >= limit) problems.push(t("fileLimit", { name: file.name, count: limit }))
      else if (!next.some((f) => f.name === file.name && f.size === file.size)) next = [...next, file]
    }
    setErrors(problems)
    set(next)
  }

  const hint =
    hintProp ??
    [accept && acceptLabel(accept, t), maxSize && t("upToSize", { size: formatBytes(maxSize, locale) }), multiple && maxFiles && t("filesMax", { count: maxFiles })].filter(Boolean).join(" · ")

  return (
    <div data-slot="file-dropzone" className={cn("grid gap-3", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-describedby={joinIds(hint ? hintId : undefined, aria["aria-describedby"])}
        aria-invalid={aria["aria-invalid"]}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          add(event.dataTransfer.files)
        }}
        data-dragging={dragging || undefined}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-6 py-8 text-center transition-colors outline-none",
          "hover:border-ring/60 hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
          "data-dragging:border-primary data-dragging:bg-primary/5 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive/60",
          classNames?.dropzone
        )}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
          <UploadCloudIcon className="size-5" />
        </span>
        <span className="text-sm font-medium">
          {title ?? (
            <>
              {/* The message, with its {browse} word underlined like a link. */}
              {t(multiple ? "dropFiles" : "dropFile", { browse: "\u0000" })
                .split("\u0000")
                .flatMap((part, i) => (i ? [<span key={i} className="text-primary-text underline underline-offset-4">{t("browse")}</span>, part] : [part]))}
            </>
          )}
        </span>
        {hint && (
          <span id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          add(event.target.files)
          event.target.value = ""
        }}
      />
      {errors.length > 0 && (
        <ul role="alert" className="grid gap-1 text-xs text-destructive-text">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {showFiles && files.length > 0 && (
        <ul aria-label={t("chosenFiles")} className={cn("grid gap-2", classNames?.files)}>
          {files.map((file) => (
            <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 rounded-lg border bg-card p-2 pe-1.5 text-sm">
              <FileThumb file={file} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">{formatBytes(file.size, locale)}</p>
              </div>
              <button
                type="button"
                aria-label={t("remove", { name: file.name })}
                disabled={disabled}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => set(files.filter((f) => f !== file))}
              >
                <XIcon className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { FileDropzone }
