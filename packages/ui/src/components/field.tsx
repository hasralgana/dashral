"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

type FieldContextValue = {
  id: string
  labelId?: string
  descriptionId?: string
  errorId?: string
  invalid: boolean
  disabled?: boolean
  required?: boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/** The label every field uses. Reach for it only when building a control of your own; it dims with a disabled field. */
function FieldLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/** What a form control takes to become a field: a label above it, a hint and an error message under it. */
type FieldOwnProps = {
  label?: React.ReactNode
  /** A hint under the control. */
  description?: React.ReactNode
  /** true shows the error style; a message also shows under the control. */
  error?: boolean | React.ReactNode
  /** At the end of the label's row, e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode
  /** Marks the label with an asterisk. */
  withAsterisk?: boolean
}

/** What a checkbox, switch or radio takes: a label and hint beside it. */
type ChoiceOwnProps = Pick<FieldOwnProps, "label" | "description" | "error">

/**
 * Draws a field's description and error in place of the field's own (the motion editions' animated ones). The ids are
 * the ones the control's aria-describedby already points at; error is the message, or null when there's none.
 */
type FieldMessages = (parts: {
  description?: React.ReactNode
  descriptionId?: string
  error: React.ReactNode | null
  errorId?: string
  /** Under a control (a field) or beside one (a checkbox's or switch's label column): how it's spaced. */
  layout: "field" | "choice"
  classNames?: FieldClassNames
}) => React.ReactNode

type FieldClassNames = {
  root?: string
  label?: string
  description?: string
  error?: string
}

type FieldProps = Omit<React.ComponentProps<"div">, "id"> &
  FieldOwnProps & {
    /** The control's id. Generated when left out. */
    id?: string
    /** Makes the control required. */
    required?: boolean
    disabled?: boolean
    /** The control is a group (radios, checkboxes): the label names it through aria-labelledby, not htmlFor. */
    group?: boolean
    classNames?: Omit<FieldClassNames, "root">
    /** Draws the description and error in place of the field's own; see FieldMessages. */
    renderMessages?: FieldMessages
  }

/** The error's message, or null when it's only a flag (true) or nothing at all. */
const errorMessage = (error: FieldOwnProps["error"]) => (error && typeof error !== "boolean" ? error : null)

/**
 * A label, a hint and an error around any form control. The control inside picks up its id, aria-describedby,
 * aria-invalid, disabled and required, so they never have to be wired by hand.
 */
function Field({ id, label, description, error, labelAction, required, withAsterisk, disabled, group, className, classNames, renderMessages, children, ...props }: FieldProps) {
  const generatedId = React.useId()
  const controlId = id ?? generatedId
  const message = errorMessage(error)
  const descriptionId = description ? `${controlId}-description` : undefined
  const errorId = message ? `${controlId}-error` : undefined
  const labelId = label && group ? `${controlId}-label` : undefined
  const invalid = Boolean(error)
  const labelElement = label && (
    <FieldLabel id={labelId} htmlFor={group ? undefined : controlId} className={classNames?.label}>
      {label}
      {withAsterisk && (
        <span aria-hidden className="-ms-1 text-destructive-text">
          *
        </span>
      )}
    </FieldLabel>
  )

  return (
    <FieldContext value={{ id: controlId, labelId, descriptionId, errorId, invalid, disabled, required }}>
      <div
        data-slot="field"
        data-disabled={disabled ? "true" : undefined}
        data-invalid={invalid || undefined}
        className={cn("group grid min-w-0 content-start gap-2", group && "gap-3", className)}
        {...props}
      >
        {labelElement && labelAction ? (
          <div className="flex items-center justify-between gap-2">
            {labelElement}
            <span data-slot="field-label-action" className="text-xs text-muted-foreground">
              {labelAction}
            </span>
          </div>
        ) : (
          labelElement
        )}
        {children}
        {renderMessages ? (
          renderMessages({ description, descriptionId, error: message, errorId, layout: "field", classNames })
        ) : (
          <>
            {description && (
              <p id={descriptionId} data-slot="field-description" className={cn("text-xs text-muted-foreground", classNames?.description)}>
                {description}
              </p>
            )}
            {message && (
              <FieldError id={errorId} className={classNames?.error}>
                {message}
              </FieldError>
            )}
          </>
        )}
      </div>
    </FieldContext>
  )
}

type FieldControlProps = {
  id?: string
  disabled?: boolean
  required?: boolean
  "aria-describedby"?: string
  "aria-labelledby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

/** Fills in a control's id and aria attributes from the Field around it. What the control sets itself wins. */
function useFieldControl<P extends FieldControlProps>(props: P): P {
  const field = React.useContext(FieldContext)
  if (!field) return props
  const describedBy = joinIds(props["aria-describedby"], field.descriptionId, field.errorId)
  return {
    ...props,
    id: props.id ?? field.id,
    disabled: props.disabled ?? field.disabled,
    required: props.required ?? field.required,
    "aria-describedby": describedBy,
    "aria-labelledby": props["aria-labelledby"] ?? field.labelId,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}

/** An error message under a control; it fades in as it appears. */
function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn(
        "animate-in text-xs text-destructive-text duration-(--duration-standard) ease-enter fade-in-0 slide-in-from-top-1 motion-reduce:slide-in-from-top-0",
        className
      )}
      {...props}
    />
  )
}

/** Joins ids for aria-describedby, leaving out the missing ones. */
const joinIds = (...ids: (string | undefined)[]) => ids.filter(Boolean).join(" ") || undefined

/** Whether a control was given anything that needs a Field around it. */
const needsField = ({ label, description, error }: FieldOwnProps) => Boolean(label || description || errorMessage(error))

type FieldWrapperProps = FieldOwnProps &
  Pick<FieldProps, "id" | "required" | "disabled" | "group" | "renderMessages"> & {
    classNames?: FieldClassNames
    children: React.ReactNode
  }

/** Puts a control in a Field when it was given a label, description or error message; otherwise leaves it bare. */
function FieldWrapper({ classNames, children, ...field }: FieldWrapperProps) {
  if (!needsField(field)) return children
  return (
    <Field {...field} className={classNames?.root} classNames={classNames}>
      {children}
    </Field>
  )
}

type SplittableProps = FieldOwnProps & {
  id?: string
  required?: boolean
  disabled?: boolean
  classNames?: FieldClassNames
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
}

/**
 * Splits a control's props in two: what its FieldWrapper takes, and what the control itself takes. The control keeps
 * its id, required, disabled and classNames, and is marked invalid when there's an error.
 */
function splitFieldProps<P extends SplittableProps>(props: P) {
  const { label, description, error, labelAction, withAsterisk, ...control } = props
  const field = {
    label,
    description,
    error,
    labelAction,
    withAsterisk,
    id: props.id,
    required: props.required,
    disabled: props.disabled,
    classNames: props.classNames,
  }
  return [field, { ...control, "aria-invalid": props["aria-invalid"] ?? (error ? true : undefined) }] as const
}

type ChoiceControlProps = {
  id?: string
  "aria-describedby"?: string
  "aria-invalid"?: true
}

type ChoiceFieldProps = ChoiceOwnProps & {
  id?: string
  disabled?: boolean
  /** The label's line height, so its first line sits level with the control: "leading-4" for a 16px control. */
  leading: string
  /** "start" puts the label first and the control at the far end, as in a settings row. */
  labelPosition?: "start" | "end"
  classNames?: FieldClassNames
  /** Renders the control with the id and aria attributes it needs. */
  children: (control: ChoiceControlProps) => React.ReactNode
  /** Draws the description and error in place of the field's own; see FieldMessages. */
  renderMessages?: FieldMessages
}

/**
 * A label and hint beside a small control: a checkbox, a switch or a radio. Clicking the label works the control.
 * With neither, it's only the control.
 */
function ChoiceField({ id, label, description, error, disabled, leading, labelPosition = "end", classNames, children, renderMessages }: ChoiceFieldProps) {
  const generatedId = React.useId()
  const controlId = id ?? generatedId
  const message = errorMessage(error)
  const invalid = error ? (true as const) : undefined

  if (!label && !description && !message) return children({ id, "aria-invalid": invalid })

  const descriptionId = description ? `${controlId}-description` : undefined
  const errorId = message ? `${controlId}-error` : undefined

  return (
    <div
      data-slot="choice-field"
      data-disabled={disabled ? "true" : undefined}
      className={cn(
        "group flex min-w-0 items-start gap-2.5",
        labelPosition === "start" && "flex-row-reverse justify-between gap-4",
        classNames?.root
      )}
    >
      {children({ id: controlId, "aria-describedby": joinIds(descriptionId, errorId), "aria-invalid": invalid })}
      <div className="grid min-w-0 gap-1">
        {label && (
          <FieldLabel
            htmlFor={controlId}
            className={cn(leading, description ? "font-medium" : "font-normal", classNames?.label)}
          >
            {label}
          </FieldLabel>
        )}
        {renderMessages ? (
          renderMessages({ description, descriptionId, error: message, errorId, layout: "choice", classNames })
        ) : (
          <>
            {description && (
              <p id={descriptionId} data-slot="field-description" className={cn("text-xs text-muted-foreground", classNames?.description)}>
                {description}
              </p>
            )}
            {message && (
              <FieldError id={errorId} className={classNames?.error}>
                {message}
              </FieldError>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export {
  Field,
  FieldLabel,
  FieldError,
  FieldWrapper,
  ChoiceField,
  useFieldControl,
  needsField,
  joinIds,
  splitFieldProps,
  type FieldOwnProps,
  type ChoiceOwnProps,
  type FieldControlProps,
  type FieldClassNames,
  type FieldMessages,
}
