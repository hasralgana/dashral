"use client"

import * as React from "react"
import { AnimatePresence, LayoutGroup, animate, motion } from "motion/react"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldOwnProps } from "@dashral/ui/components/field"
import type { InputOTPProps } from "@dashral/ui/components/input-otp"
import { cn } from "@dashral/ui/lib/utils"

import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { InputOTPProps } from "@dashral/ui/components/input-otp"

const allowed = { digits: /[^0-9]/g, alphanumeric: /[^0-9a-zA-Z]/g }

/**
 * The kit's InputOTP with motion: the same length, pattern, groups, mask and field props. Each character pops into its
 * box and shrinks out when deleted; the focus is one ring that glides from box to box as you type; an error shakes the
 * row (again each time it changes); and a full code ripples through the boxes, one after another. With reduced motion
 * characters only fade and nothing shakes or ripples.
 */
export function InputOTP(props: InputOTPProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} renderMessages={motionMessages}>
      <InputOTPControl {...control} error={props.error} />
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
  error,
  ...rest
}: Omit<InputOTPProps, Exclude<keyof FieldOwnProps, "error">>) {
  const props = useFieldControl(rest)
  const reduced = useReducedMotion()
  const [own, setOwn] = React.useState(defaultValue)
  const code = (value ?? own).slice(0, length)
  const [focused, setFocused] = React.useState(false)
  const row = React.useRef<HTMLDivElement>(null)
  const group = React.useId()

  // A full code ripples through the boxes; each time it's filled again, it ripples again.
  const [ripples, setRipples] = React.useState(0)
  function change(raw: string) {
    const next = raw.replace(allowed[pattern], "").slice(0, length).toUpperCase()
    if (next === code) return
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
    if (next.length === length) {
      setRipples((n) => n + 1)
      onComplete?.(next)
    }
  }

  // An error (or a new one) shakes the row.
  const errorKey = error ? (typeof error === "string" ? error : "error") : null
  const shown = React.useRef(errorKey)
  React.useEffect(() => {
    if (shown.current === errorKey) return
    shown.current = errorKey
    if (errorKey === null || reduced || !row.current) return
    const controls = animate(row.current, { x: [0, -7, 6, -4, 2, 0] }, { duration: 0.4, ease: "easeOut" })
    return () => controls.stop()
  }, [errorKey, reduced])

  const active = Math.min(code.length, length - 1)
  const runs = groups && groups.reduce((sum, n) => sum + n, 0) === length ? groups : [length]
  let start = 0

  return (
    <div
      ref={row}
      data-slot="input-otp"
      data-disabled={props.disabled || undefined}
      className={cn("group/otp relative flex w-fit items-center gap-2 has-disabled:opacity-50", className)}
    >
      <input
        {...props}
        type="text"
        value={code}
        onChange={(event) => change(event.target.value)}
        onFocus={(event) => {
          setFocused(true)
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
      <LayoutGroup id={group}>
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
                    <motion.div
                      key={`${index}-${ripples}`}
                      data-slot="input-otp-slot"
                      data-filled={char ? "" : undefined}
                      className={cn(
                        "relative grid place-items-center rounded-md border border-input bg-transparent font-medium shadow-xs transition-[color,border-color] tabular-nums",
                        size === "lg" ? "size-12 text-xl" : "size-10 text-lg",
                        "group-has-[[aria-invalid=true]]/otp:border-destructive",
                        classNames?.slot
                      )}
                      // The ripple: each box lifts a little, one after another.
                      initial={false}
                      animate={ripples && !reduced ? { y: [0, -5, 0] } : undefined}
                      transition={{ duration: duration.considered, ease: ease.standard, delay: index * 0.04 }}
                    >
                      {/* The focus: one ring gliding from box to box. */}
                      {current && (
                        <motion.span
                          layoutId="otp-focus"
                          aria-hidden
                          className="pointer-events-none absolute -inset-px rounded-[inherit] border border-ring ring-2 ring-ring/15 group-has-[[aria-invalid=true]]/otp:border-destructive group-has-[[aria-invalid=true]]/otp:ring-destructive/15"
                          transition={reduced ? { duration: 0 } : spring.move}
                        />
                      )}
                      <AnimatePresence mode="popLayout" initial={false}>
                        {char ? (
                          <motion.span
                            key={char + index}
                            className="col-start-1 row-start-1"
                            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, transition: { duration: duration.fast, ease: ease.exit } }}
                            transition={reduced ? { duration: duration.fast } : spring.pop}
                          >
                            {mask ? <span className="block size-2 rounded-full bg-current" /> : char}
                          </motion.span>
                        ) : (
                          current && (
                            // The caret, blinking in the box that's next, while it's empty.
                            <span key="caret" className="col-start-1 row-start-1 h-5 w-px animate-pulse bg-foreground [animation-duration:1s] motion-reduce:animate-none" />
                          )
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </React.Fragment>
          )
        })}
      </LayoutGroup>
    </div>
  )
}
