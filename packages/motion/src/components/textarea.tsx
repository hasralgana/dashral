"use client"

import * as React from "react"
import { animate, type AnimationPlaybackControls } from "motion/react"
import { Field, joinIds } from "@dashral/ui/components/field"
import { Textarea as KitTextarea, type TextareaProps } from "@dashral/ui/components/textarea"
import { cn } from "@dashral/ui/lib/utils"

import { FieldMessage } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { spring } from "../lib/tokens"

export type { TextareaProps } from "@dashral/ui/components/textarea"

/** What the error says, for telling a new error from a re-render of the same one; null when there's none. */
function errorKey(error: TextareaProps["error"]) {
  if (!error) return null
  return typeof error === "string" || typeof error === "number" ? String(error) : typeof error === "boolean" ? "" : "node"
}

/**
 * The kit's Textarea with motion: the same label, description, error and props. It grows with what's typed as the
 * kit's does, but glides to each new line's height instead of jumping, and back down when text is cleared. When it
 * turns invalid, and again at every try to submit its form while it's still invalid, it gives a short shake, and the error message grows in under it and folds away when it's fixed. With
 * reduced motion it resizes at once, nothing shakes, and messages only fade.
 */
export function Textarea({ label, description, error, labelAction, withAsterisk, id, required, disabled, className, classNames, ref, onInput, ...props }: TextareaProps) {
  const reduced = useReducedMotion()
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const area = React.useRef<HTMLTextAreaElement | null>(null)
  const [element, setElement] = React.useState<HTMLTextAreaElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      area.current = node
      setElement(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  // Its height: what its text needs (as the kit's field-sizing has it), reached on a glide.
  const glide = React.useRef<AnimationPlaybackControls | null>(null)
  const fit = React.useCallback(
    (now: boolean) => {
      const node = area.current
      if (!node) return
      const from = node.offsetHeight
      node.style.height = "auto"
      const to = node.scrollHeight + node.offsetHeight - node.clientHeight
      glide.current?.stop()
      if (now || reduced || from === to || !from) {
        node.style.height = `${to}px`
        return
      }
      node.style.height = `${from}px`
      glide.current = animate(from, to, { ...spring.glide, onUpdate: (h) => (node.style.height = `${h}px`) })
    },
    [reduced]
  )
  // Set from outside (a form reset, a message sent), it glides too; the first measure is at once.
  const measured = React.useRef(false)
  React.useLayoutEffect(() => {
    fit(!measured.current)
    measured.current = true
  }, [fit, props.value])
  // A new width rewraps the text: follow it at once.
  React.useEffect(() => {
    const node = area.current
    if (!node) return
    let width = node.offsetWidth
    const observer = new ResizeObserver(() => {
      if (node.offsetWidth === width) return
      width = node.offsetWidth
      fit(true)
    })
    observer.observe(node)
    return () => {
      observer.disconnect()
      glide.current?.stop()
    }
  }, [fit])

  const key = errorKey(error)
  const shown = React.useRef(key)
  const shake = React.useCallback(() => {
    const box = area.current
    if (reduced || !box) return
    animate(box, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.36, ease: "easeOut" })
  }, [reduced])
  // It shakes when it turns invalid or the error changes…
  React.useEffect(() => {
    if (shown.current === key) return
    shown.current = key
    if (key !== null) shake()
  }, [key, shake])
  // …and again at every try to submit its form while it's still invalid, so a second click on Submit isn't met with
  // nothing; the browser's own check (required, type="email") finding it invalid shakes it too.
  React.useEffect(() => {
    const form = element?.form
    if (!element) return
    // Before the form's own handler (capture), so it's the error from the last try that counts; a new one shakes above.
    const onSubmit = () => {
      if (shown.current !== null) shake()
    }
    form?.addEventListener("submit", onSubmit, true)
    element.addEventListener("invalid", shake)
    return () => {
      form?.removeEventListener("submit", onSubmit, true)
      element.removeEventListener("invalid", shake)
    }
  }, [element, shake])

  const message = error && typeof error !== "boolean" ? error : null
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = message ? `${fieldId}-error` : undefined
  const control = (
    <KitTextarea
      {...props}
      ref={setRef}
      id={fieldId}
      required={required}
      disabled={disabled}
      aria-invalid={props["aria-invalid"] ?? (error ? true : undefined)}
      aria-describedby={joinIds(props["aria-describedby"], descriptionId, errorId)}
      onInput={(event) => {
        fit(false)
        onInput?.(event)
      }}
      // The height is this component's, so the browser's own sizing (and its resize handle) stand aside.
      className={cn("field-sizing-fixed resize-none overflow-hidden", className)}
      classNames={classNames}
    />
  )

  if (!label && !description && !message) return control

  return (
    <Field
      id={fieldId}
      label={label}
      labelAction={labelAction}
      withAsterisk={withAsterisk}
      required={required}
      disabled={disabled}
      error={Boolean(error)}
      className={classNames?.root}
      classNames={{ label: classNames?.label }}
    >
      {/* No gap in here: each line under the box brings its own space, so a message's space grows in with it. */}
      <div className="grid min-w-0">
        {control}
        {description && (
          <p id={descriptionId} data-slot="field-description" className={cn("pt-2 text-xs text-muted-foreground", classNames?.description)}>
            {description}
          </p>
        )}
        <FieldMessage id={errorId} message={message} className={classNames?.error} />
      </div>
    </Field>
  )
}
