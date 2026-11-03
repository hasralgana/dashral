"use client"

import * as React from "react"
import { animate } from "motion/react"
import { Field, joinIds } from "@dashral/ui/components/field"
import { Input as KitInput, type InputProps } from "@dashral/ui/components/input"
import { cn } from "@dashral/ui/lib/utils"

import { FieldMessage } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"

export type { InputProps } from "@dashral/ui/components/input"

/** What the error says, for telling a new error from a re-render of the same one; null when there's none. */
function errorKey(error: InputProps["error"]) {
  if (!error) return null
  return typeof error === "string" || typeof error === "number" ? String(error) : typeof error === "boolean" ? "" : "node"
}

/**
 * The kit's Input with motion: the same label, description, prefix, suffix, format and props. When it turns invalid
 * (or the error changes), and again at every try to submit its form while it's still invalid, the box gives a short
 * shake; the error message grows in under it, the words below gliding
 * down instead of jumping, and folds away when it's fixed; a new message crosses over the old one. With reduced
 * motion nothing shakes and messages only fade.
 */
export function Input({ label, description, error, labelAction, withAsterisk, id, required, disabled, classNames, ref, ...props }: InputProps) {
  const reduced = useReducedMotion()
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const input = React.useRef<HTMLInputElement | null>(null)
  const [element, setElement] = React.useState<HTMLInputElement | null>(null)
  // Its own ref (to find the box to shake) and the one it's given (a form library's), both.
  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node
      setElement(node)
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )

  const key = errorKey(error)
  const shown = React.useRef(key)
  const shake = React.useCallback(() => {
    // The box you see: the input itself, or the box around it and its affixes.
    const box = input.current?.closest<HTMLElement>("[data-slot=input]")
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
    <KitInput
      {...props}
      ref={setRef}
      id={fieldId}
      required={required}
      disabled={disabled}
      aria-invalid={props["aria-invalid"] ?? (error ? true : undefined)}
      aria-describedby={joinIds(props["aria-describedby"], descriptionId, errorId)}
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
