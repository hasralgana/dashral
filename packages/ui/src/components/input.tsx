"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { countSignificant, inputFormatter, type CardBrand, type InputFormat } from "../lib/input-format"
import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { FieldWrapper, splitFieldProps, useFieldControl, type FieldClassNames, type FieldOwnProps } from "./field"

type InputProps = Omit<React.ComponentProps<"input">, "prefix"> &
  FieldOwnProps & {
    /** Shown inside the field before the text: an icon, or text such as "https://" or "$". */
    prefix?: React.ReactNode
    /** Shown inside the field after the text: an icon, a unit, or a button such as a password toggle. */
    suffix?: React.ReactNode
    /** Drops the border, background and focus ring, for an input styled entirely by you. */
    unstyled?: boolean
    /** With type="password": a button at the end that shows and hides the password. On by default. */
    revealable?: boolean
    /**
     * Formats as you type: "card", "phone", "date", "expiry", "time", "number" ({ type: "number", decimals: 2 } for
     * decimals) or { pattern: "##.###.###.#-###.###" } (# a digit, A a letter). The caret stays where you're typing.
     * value and onChange carry the text as shown; onValueChange gets the raw value too.
     */
    format?: InputFormat
    /** With format: the raw value ("4242424242424242", "1234.5"), the text as shown, and a card's brand. */
    onValueChange?: (raw: string, details: { formatted: string; brand?: CardBrand }) => void
    /** Classes for each part. className styles the box you see: the input, or the box around it and its affixes. */
    classNames?: FieldClassNames & { wrapper?: string; input?: string; prefix?: string; suffix?: string }
  }

const boxClass = "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] md:text-sm"
const textClass = "outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground"
// readOnly reads as such: a quiet box and muted text, so nobody tries to type in it (it still focuses, selects and
// copies). By the attribute, not :read-only, which a file input matches too.
const readOnlyClass = "[&[readonly]]:bg-muted/50 [&[readonly]]:text-muted-foreground"

/**
 * A text field. On its own it's a plain input; give it a label, description or error and it becomes a whole field,
 * with the ids and aria attributes wired up. prefix and suffix put icons, text or buttons inside the box.
 */
function Input(props: InputProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field}>
      <InputControl {...control} />
    </FieldWrapper>
  )
}

const autoCompletes: Partial<Record<string, string>> = { card: "cc-number", expiry: "cc-exp", phone: "tel" }

/** The input's props with formatting wired in: the shown value, the keyboard and autofill hints, and onChange. */
function useFormat(
  format: InputFormat | undefined,
  onValueChange: InputProps["onValueChange"],
  props: React.ComponentProps<"input">
): React.ComponentProps<"input"> {
  const { locale } = useLocale()
  const key = JSON.stringify(format ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the format's contents, so an inline object is fine
  const formatter = React.useMemo(() => (format ? inputFormatter(format, locale) : null), [key, locale])
  // The text before the latest keystroke, to tell a deleted separator from a deleted character.
  const before = React.useRef("")
  if (!formatter || !format) return props

  const numeric = format === "number" || (typeof format === "object" && "type" in format)
  const show = (value: unknown) => (value === undefined || value === null ? undefined : formatter.format(String(value)).text)

  return {
    ...props,
    value: show(props.value),
    defaultValue: show(props.defaultValue),
    inputMode: props.inputMode ?? (numeric ? (typeof format === "object" && "type" in format && format.decimals ? "decimal" : "numeric") : typeof format === "object" ? undefined : "numeric"),
    autoComplete: props.autoComplete ?? (typeof format === "string" ? autoCompletes[format] : undefined),
    onKeyDown(event) {
      before.current = event.currentTarget.value
      props.onKeyDown?.(event)
    },
    onChange(event) {
      const input = event.currentTarget
      const typed = input.value
      const caret = input.selectionStart ?? typed.length
      let head = typed.slice(0, caret)
      let text = typed
      // Backspace on a separator ("4242 |4242"): delete the character before it as well, or nothing would change.
      const { significant } = formatter
      if (
        (event.nativeEvent as InputEvent).inputType === "deleteContentBackward" &&
        typed.length < before.current.length &&
        countSignificant(typed, significant) === countSignificant(before.current, significant)
      ) {
        let i = head.length - 1
        while (i >= 0 && !significant.test(head[i]!)) i--
        if (i >= 0) {
          head = head.slice(0, i)
          text = head + typed.slice(caret)
        }
      }
      const result = formatter.format(text)
      if (input.value !== result.text) input.value = result.text
      if (document.activeElement === input) {
        const at = formatter.caret(head, result.text)
        input.setSelectionRange(at, at)
      }
      before.current = result.text
      onValueChange?.(result.raw, { formatted: result.text, brand: result.brand })
      props.onChange?.(event)
    },
  }
}

function InputControl({
  prefix,
  suffix: suffixProp,
  unstyled,
  revealable = true,
  format,
  onValueChange,
  className,
  classNames,
  ...rest
}: Omit<InputProps, keyof FieldOwnProps>) {
  const { type: typeProp, ...fieldProps } = useFieldControl(rest)
  const props = useFormat(format, onValueChange, fieldProps)
  const { t } = useLocale()
  const [revealed, setRevealed] = React.useState(false)
  const reveal = typeProp === "password" && revealable
  const type = reveal && revealed ? "text" : typeProp
  // The password's show/hide button, after any suffix of your own. It keeps the caret where it was.
  const suffix = reveal ? (
    <>
      {suffixProp}
      <button
        type="button"
        data-slot="input-reveal"
        aria-label={revealed ? t("hidePassword") : t("showPassword")}
        aria-pressed={revealed}
        disabled={props.disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setRevealed(!revealed)}
        className="-me-1 grid size-6 place-items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
      >
        {revealed ? <EyeOff /> : <Eye />}
      </button>
    </>
  ) : (
    suffixProp
  )

  if (!prefix && !suffix) {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          !unstyled && [
            boxClass,
            textClass,
            "px-3 py-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            // type="file": the browser's "Choose file" is a small, quiet button set in the box with the same 3px on
            // every side (36px box − 2px border − 6px = the button's 28px), its corners following the box's.
            type === "file" &&
              "p-[3px] file:me-3 file:inline-flex file:h-7 file:items-center file:rounded-[calc(var(--radius-md)-3px)] file:border-0 file:bg-muted file:px-3 file:text-sm file:font-medium file:text-foreground file:transition-colors hover:file:bg-accent",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
            readOnlyClass,
          ],
          className,
          classNames?.input
        )}
        {...props}
      />
    )
  }

  const affixClass =
    "flex h-full shrink-0 items-center gap-1.5 text-muted-foreground transition-colors select-none group-focus-within/input:text-foreground group-has-[[aria-invalid=true]]/input:text-destructive-text [&_svg]:size-4 [&_svg]:shrink-0"

  return (
    <div
      data-slot="input"
      data-disabled={props.disabled || undefined}
      // A click on an affix (but not on a button in it) focuses the input, as if the box were all input.
      onMouseDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest("input, button, a, [tabindex]")) return
        event.preventDefault()
        event.currentTarget.querySelector("input")?.focus()
      }}
      className={cn(
        "group/input cursor-text items-center",
        !unstyled && [
          boxClass,
          "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/15",
          "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/15",
          "data-disabled:cursor-not-allowed data-disabled:opacity-50",
          "has-[input[readonly]]:bg-muted/50 has-[input[readonly]]:text-muted-foreground",
        ],
        className,
        classNames?.wrapper
      )}
    >
      {prefix && (
        <span data-slot="input-prefix" className={cn(affixClass, "ps-3", classNames?.prefix)}>
          {prefix}
        </span>
      )}
      <input
        type={type}
        className={cn(
          "h-full w-full min-w-0 flex-1 bg-transparent px-3 py-1 disabled:cursor-not-allowed",
          textClass,
          prefix && "ps-2",
          suffix && "pe-2",
          classNames?.input
        )}
        {...props}
      />
      {suffix && (
        <span data-slot="input-suffix" className={cn(affixClass, "pe-3", classNames?.suffix)}>
          {suffix}
        </span>
      )}
    </div>
  )
}

export { Input, type InputProps }
