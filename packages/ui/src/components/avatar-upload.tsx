"use client"

import * as React from "react"
import { CameraIcon, UserIcon } from "lucide-react"

import { accepts, formatBytes } from "../lib/files"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { Button } from "./button"
import { Dialog, DialogClose } from "./dialog"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldControlProps, type FieldOwnProps } from "./field"
import { cropImage, ImageCropper, type CropArea } from "./image-cropper"

type AvatarUploadProps = FieldOwnProps & {
  /** The picture now: a URL (say, from your server) or the File cropped last. null for none. */
  value?: File | string | null
  defaultValue?: File | string | null
  /** The cropped picture as a File, ready to upload, or null when it's removed. */
  onValueChange?: (file: File | null) => void
  /** Like the `accept` attribute. */
  accept?: string
  /** Largest picture someone can pick, in bytes (before cropping). */
  maxSize?: number
  /** A circle for a person, a square for a logo. The file is square either way. */
  shape?: "circle" | "square"
  /** In the picture's place when there's none, e.g. initials. A person icon by default. */
  fallback?: React.ReactNode
  /** Width and height of the file, in pixels. */
  outputSize?: number
  /** "image/jpeg" (the default), "image/png" to keep a logo's transparency, or "image/webp". */
  outputType?: string
  /** The crop dialog's title and the line under it. */
  cropTitle?: React.ReactNode
  cropDescription?: React.ReactNode
  disabled?: boolean
  required?: boolean
  id?: string
  /** Sends the cropped file with a form, as a file input of this name would. */
  name?: string
  className?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  classNames?: FieldClassNames & { preview?: string; actions?: string }
}

/**
 * A profile photo or logo with its upload in one tag: pick a picture (or drop it on the preview), crop it in a dialog
 * and get a square File back, sized and compressed, to upload wherever onValueChange sends it.
 */
function AvatarUpload(props: AvatarUploadProps) {
  const [field, { required: _required, ...control }] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group>
      <AvatarUploadControl {...control} />
    </FieldWrapper>
  )
}

/** Whether it's a File; `File` isn't there on every server that renders the page. */
const isFile = (value: unknown): value is File => typeof File !== "undefined" && value instanceof File

/** A File's object URL for as long as it's shown, or the URL itself. */
function usePictureUrl(value: File | string | null) {
  const [fileUrl, setFileUrl] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!isFile(value)) return setFileUrl(null)
    const next = URL.createObjectURL(value)
    setFileUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [value])
  return isFile(value) ? fileUrl : value || null
}

function AvatarUploadControl({
  value,
  defaultValue = null,
  onValueChange,
  accept = "image/*",
  maxSize,
  shape = "circle",
  fallback,
  outputSize = 512,
  outputType = "image/jpeg",
  cropTitle,
  cropDescription,
  name,
  className,
  classNames,
  ...rest
}: Omit<AvatarUploadProps, keyof FieldOwnProps | "required">) {
  const { id, disabled, ...aria } = useFieldControl<FieldControlProps>({ id: rest.id, disabled: rest.disabled, "aria-invalid": rest["aria-invalid"] })
  const { t, locale } = useLocale()
  const [internal, setInternal] = React.useState<File | string | null>(defaultValue)
  const current = value === undefined ? internal : value
  const url = usePictureUrl(current)

  const pickerRef = React.useRef<HTMLInputElement>(null)
  const formRef = React.useRef<HTMLInputElement>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  // The picture being cropped, its crop, and whether the dialog is open (it stays mounted while it closes).
  const [picked, setPicked] = React.useState<{ file: File; url: string } | null>(null)
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [cropError, setCropError] = React.useState(false)
  // Set once the picture in the dialog has loaded; Apply waits for it.
  const [area, setArea] = React.useState<CropArea | null>(null)
  const errorId = React.useId()

  React.useEffect(() => {
    if (!picked) return
    return () => URL.revokeObjectURL(picked.url)
  }, [picked])

  // The form's copy of the file, so a plain form submit (or a server action) gets the cropped picture.
  React.useEffect(() => {
    const input = formRef.current
    if (!input || typeof DataTransfer === "undefined") return
    const transfer = new DataTransfer()
    if (isFile(current)) transfer.items.add(current)
    input.files = transfer.files
  }, [current, name])

  function set(next: File | null) {
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  function pick(list: FileList | null) {
    const file = list?.[0]
    if (!file || disabled) return
    if (!file.type.startsWith("image/") || !accepts(file, accept)) return setError(t("fileType", { name: file.name }))
    if (maxSize !== undefined && file.size > maxSize) return setError(t("fileSize", { name: file.name, size: formatBytes(maxSize, locale) }))
    setError(null)
    setArea(null)
    setCropError(false)
    setPicked({ file, url: URL.createObjectURL(file) })
    setOpen(true)
  }

  async function apply() {
    if (!picked || !area || saving) return
    setSaving(true)
    setCropError(false)
    try {
      const blob = await cropImage(picked.url, area, { width: outputSize, type: outputType })
      const extension = blob.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg"
      const base = picked.file.name.replace(/\.[^.]+$/, "") || "avatar"
      set(new File([blob], `${base}.${extension}`, { type: blob.type }))
      setOpen(false)
    } catch {
      // A picture the browser can show but not draw (too big for a canvas, say): say so and keep the dialog open.
      setCropError(true)
    } finally {
      setSaving(false)
    }
  }

  const radius = shape === "circle" ? "rounded-full" : "rounded-lg"
  // A circle is someone's photo; a square is a logo or another image.
  const words =
    shape === "circle"
      ? { upload: t("uploadPhoto"), change: t("changePhoto"), remove: t("removePhoto"), title: t("cropPhoto"), hint: t("cropPhotoHint") }
      : { upload: t("uploadImage"), change: t("changeImage"), remove: t("removeImage"), title: t("cropImage"), hint: t("cropImageHint") }

  return (
    <div
      data-slot="avatar-upload"
      role="group"
      aria-labelledby={aria["aria-labelledby"]}
      aria-describedby={aria["aria-describedby"]}
      className={cn("grid gap-2", className)}
    >
      <div className="flex items-center gap-4">
        {/* The preview is a big target for the pointer and for a dropped file; keyboards and screen readers use the
            button beside it, which says what it does. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          aria-invalid={aria["aria-invalid"]}
          onClick={() => pickerRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            if (!disabled) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            pick(event.dataTransfer.files)
          }}
          data-dragging={dragging || undefined}
          className={cn(
            // Its insides ignore the pointer, so dragging over them doesn't count as leaving it.
            "group/preview relative isolate flex size-16 *:pointer-events-none shrink-0 items-center justify-center overflow-hidden border bg-muted text-muted-foreground outline-none",
            "transition-[box-shadow,border-color] duration-(--duration-fast) ease-standard disabled:pointer-events-none disabled:opacity-50",
            "data-dragging:border-primary data-dragging:ring-4 data-dragging:ring-primary/20 aria-invalid:border-destructive/60",
            radius,
            classNames?.preview
          )}
        >
          <span aria-hidden className="flex items-center justify-center text-lg font-medium">
            {fallback ?? <UserIcon className="size-6" />}
          </span>
          <Pictures url={url} />
          {/* A camera over the picture on hover, focus or while a file is dragged over it. */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-(--duration-fast) ease-standard",
              "group-hover/preview:opacity-100 group-data-dragging/preview:opacity-100"
            )}
          >
            <CameraIcon className="size-5" />
          </span>
        </button>
        <div className={cn("flex flex-wrap items-center gap-2", classNames?.actions)}>
          <Button
            type="button"
            id={id}
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-invalid={aria["aria-invalid"] ?? (error ? true : undefined)}
            aria-describedby={error ? errorId : undefined}
            onClick={() => pickerRef.current?.click()}
          >
            {url ? words.change : words.upload}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => set(null)} className="text-muted-foreground">
              {words.remove}
            </Button>
          )}
        </div>
      </div>
      <input
        ref={pickerRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          pick(event.target.files)
          event.target.value = ""
        }}
      />
      {name && <input ref={formRef} type="file" name={name} className="sr-only" tabIndex={-1} aria-hidden />}
      {error && (
        <p id={errorId} role="alert" className="animate-in text-xs text-destructive-text duration-(--duration-standard) ease-enter fade-in-0">
          {error}
        </p>
      )}
      <Dialog
        open={open}
        // Not closed halfway through saving, so a crop can't land after it was cancelled.
        onOpenChange={(next) => !saving && setOpen(next)}
        size="sm"
        title={cropTitle ?? words.title}
        description={cropDescription ?? words.hint}
        footer={
          <>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="button" loading={saving} disabled={!area} onClick={apply}>
              {t("apply")}
            </Button>
          </>
        }
      >
        {picked && (
          <div className="grid gap-2">
            <ImageCropper src={picked.url} shape={shape === "circle" ? "circle" : "rect"} onCropChange={setArea} height={280} />
            {cropError && (
              <p role="alert" className="text-xs text-destructive-text">
                {t("cropFailed")}
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  )
}

/**
 * The picture in the preview. A new one fades in over the old, and a removed one fades out, so the preview never
 * blinks empty in between.
 */
function Pictures({ url }: { url: string | null }) {
  const [layers, setLayers] = React.useState<{ url: string; leaving: boolean }[]>(url ? [{ url, leaving: false }] : [])
  const [shown, setShown] = React.useState(url)
  if (shown !== url) {
    setShown(url)
    setLayers((all) => [...all.filter((layer) => layer.url !== url).map((layer) => ({ ...layer, leaving: true })), ...(url ? [{ url, leaving: false }] : [])])
  }
  const top = layers.at(-1)
  return layers.map((layer) => {
    // A leaving picture under a new one stays put until the new one has faded in; with nothing over it, it fades out.
    const fading = layer.leaving && layer === top
    return (
      <Picture
        key={layer.url}
        url={layer.url}
        leaving={fading}
        // Faded out: gone. Faded in: the pictures under it can go.
        onDone={() => setLayers((all) => all.filter((item) => (layer.leaving ? item !== layer : !item.leaving)))}
      />
    )
  })
}

function Picture({ url, leaving, onDone }: { url: string; leaving: boolean; onDone: () => void }) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <img
      src={url}
      alt=""
      draggable={false}
      onLoad={() => setLoaded(true)}
      // A picture that won't load stays hidden over the fallback, and lets the one under it go.
      onError={onDone}
      onAnimationEnd={onDone}
      className={cn(
        "absolute inset-0 size-full object-cover",
        !loaded && "opacity-0",
        loaded && !leaving && "animate-in fade-in-0 duration-(--duration-standard) ease-enter",
        leaving && "animate-out fade-out-0 fill-mode-forwards duration-(--duration-standard) ease-exit"
      )}
    />
  )
}

export { AvatarUpload, type AvatarUploadProps }
