"use client"

import * as React from "react"

import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type InputOTPProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "maxLength" | "type" | "size" | "pattern"> &
  FieldOwnProps & {
    /** How many characters the code has. */
    length?: number
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    /** Called once every slot is filled, e.g. to verify the code right away. */
    onComplete?: (value: string) => void
    /** What can be typed: digits (the default, with the number keypad on phones) or letters and digits. */
    pattern?: "digits" | "alphanumeric"
    /** Splits the slots into groups with a dash between, e.g. [3, 3]. */
    groups?: number[]
    /** Dots in place of the characters, for a PIN. */
    mask?: boolean
    size?: "default" | "lg"
    classNames?: FieldClassNames & { slots?: string; slot?: string }
  }

const allowed = { digits: /[^0-9]/g, alphanumeric: /[^0-9a-zA-Z]/g }

/**
 * A one-time code in boxes, one character each: type, paste or let the phone fill it from a text message (it's one
 * real input underneath, with autocomplete="one-time-code"). Give it a label, description or error and it becomes a
 * whole field. onComplete fires once every box is filled.
 */
function InputOTP(props: InputOTPProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <InputOTPControl {...control} />
    </FieldWrapper>
  )
}

function InputOTPControl({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  pattern = "digits",
  groups,
  mask = false,
  size = "default",
  className,
  classNames,
  onFocus,
  onBlur,
  ...rest
}: Omit<InputOTPProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  const [own, setOwn] = React.useState(defaultValue)
  const code = (value ?? own).slice(0, length)
  const [focused, setFocused] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)

  function change(raw: string) {
    const next = raw.replace(allowed[pattern], "").slice(0, length).toUpperCase()
    if (next === code) return
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
    if (next.length === length) onComplete?.(next)
  }

  // The box the next character goes in: after the last one typed, or the last box once they're all filled.
  const active = Math.min(code.length, length - 1)
  const runs = groups && groups.reduce((sum, n) => sum + n, 0) === length ? groups : [length]
  let start = 0

  return (
    <div
      data-slot="input-otp"
      data-disabled={props.disabled || undefined}
      className={cn("group/otp relative flex w-fit items-center gap-2 has-disabled:opacity-50", className)}
    >
      <input
        ref={input}
        {...props}
        type="text"
        value={code}
        onChange={(event) => change(event.target.value)}
        onFocus={(event) => {
          setFocused(true)
          // Typing always goes on at the end, so a stray tap in the middle doesn't type over a box.
          const end = event.currentTarget.value.length
          event.currentTarget.setSelectionRange(end, end)
          onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          onBlur?.(event)
        }}
        onSelect={(event) => {
          const end = event.currentTarget.value.length
          if (event.currentTarget.selectionStart !== end) event.currentTarget.setSelectionRange(end, end)
        }}
        maxLength={length}
        inputMode={pattern === "digits" ? "numeric" : "text"}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        // Over the boxes, invisible: it takes the taps, the keys and what's pasted or filled in.
        className="absolute inset-0 z-10 size-full cursor-text appearance-none bg-transparent text-transparent caret-transparent opacity-0 outline-none disabled:cursor-not-allowed"
      />
      {runs.map((run, i) => {
        const from = start
        start += run
        return (
          <React.Fragment key={i}>
            {i > 0 && <span aria-hidden className="h-0.5 w-2 shrink-0 rounded-full bg-border" />}
            <div aria-hidden className={cn("flex gap-2", classNames?.slots)}>
              {Array.from({ length: run }, (_, j) => {
                const index = from + j
                const char = code[index]
                const current = focused && index === active
                return (
                  <div
                    key={index}
                    data-slot="input-otp-slot"
                    data-active={current || undefined}
                    data-filled={char ? "" : undefined}
                    className={cn(
                      "relative grid place-items-center rounded-md border border-input bg-transparent font-medium shadow-xs tabular-nums",
                      // The ring glides to the box that's next instead of jumping.
                      "transition-[color,box-shadow,border-color] duration-(--duration-fast) ease-standard motion-reduce:transition-none",
                      size === "lg" ? "size-12 text-xl" : "size-10 text-lg",
                      "data-active:border-ring data-active:ring-2 data-active:ring-ring/15",
                      "group-has-[[aria-invalid=true]]/otp:border-destructive group-has-[[aria-invalid=true]]/otp:data-active:ring-destructive/15",
                      classNames?.slot
                    )}
                  >
                    {/* Each character settles into its box, and again when it changes (keyed by it): a quick fade and a
                        small zoom. With reduced motion it's simply there. */}
                    {char && (
                      <span key={char} className="grid place-items-center animate-in duration-(--duration-fast) ease-enter fade-in-0 zoom-in-75 motion-reduce:animate-none">
                        {mask ? <span className="size-2 rounded-full bg-current" /> : char}
                      </span>
                    )}
                    {/* The caret, blinking in the box that's next, while it's empty. */}
                    {current && !char && <span className="h-5 w-px animate-pulse bg-foreground [animation-duration:1s] motion-reduce:animate-none" />}
                  </div>
                )
              })}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export { InputOTP, type InputOTPProps }
