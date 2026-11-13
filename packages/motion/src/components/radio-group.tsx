"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { animate, motion, useMotionValue } from "motion/react"
import { ChoiceField, FieldLabel, FieldWrapper, splitFieldProps, useFieldControl, type FieldOwnProps } from "@dashral/ui/components/field"
import type { RadioGroupProps } from "@dashral/ui/components/radio-group"
import { cn } from "@dashral/ui/lib/utils"

import { useHoverPill } from "../lib/hover"
import { motionMessages } from "../lib/field"
import { useReducedMotion } from "../lib/reduced"
import { duration, ease, spring } from "../lib/tokens"

export type { RadioGroupProps, RadioOption } from "@dashral/ui/components/radio-group"

type ControlColor = NonNullable<RadioGroupProps["color"]>

// The dot and border when picked, as the kit's RadioGroup has them. Every class is written out in full so Tailwind finds it.
const radioColors: Record<ControlColor, string> = {
  primary: "text-primary data-[state=checked]:border-primary",
  neutral: "text-foreground data-[state=checked]:border-foreground",
  info: "text-info data-[state=checked]:border-info",
  success: "text-success data-[state=checked]:border-success",
  warning: "text-warning data-[state=checked]:border-warning",
  destructive: "text-destructive data-[state=checked]:border-destructive",
  highlight: "text-highlight data-[state=checked]:border-highlight",
}

// The picked card's frame: its border and a tint in the color.
const frameColors: Record<ControlColor, string> = {
  primary: "border-primary bg-primary/5",
  neutral: "border-foreground bg-foreground/5",
  info: "border-info bg-info/5",
  success: "border-success bg-success/5",
  warning: "border-warning bg-warning/5",
  destructive: "border-destructive bg-destructive/5",
  highlight: "border-highlight bg-highlight/5",
}

/**
 * The kit's RadioGroup with motion: the same options, variants, colors and props. The picked radio's dot springs in
 * from nothing while the one you left shrinks away; with variant="cards" the picked card's frame and tint glide from
 * card to card (one frame over the group, measured from the cards' layout), a soft hover glides after the pointer
 * from card to card without a blink, and a card presses in while held. With reduced motion the dot and frame only fade.
 */
export function RadioGroup(props: RadioGroupProps) {
  const [field, control] = splitFieldProps(props)
  return (
    <FieldWrapper {...field} group renderMessages={motionMessages}>
      <RadioGroupControl {...control} />
    </FieldWrapper>
  )
}

function RadioGroupControl({
  options,
  variant = "default",
  indicator = true,
  color = "primary",
  value,
  defaultValue,
  onValueChange,
  className,
  classNames,
  ...rest
}: Omit<RadioGroupProps, keyof FieldOwnProps>) {
  const props = useFieldControl(rest)
  const reduced = useReducedMotion()
  const groupId = React.useId()
  const [own, setOwn] = React.useState(defaultValue ?? "")
  const picked = value ?? own

  // The picked card's frame: one element over the group, gliding to that card's place. Measured from the cards' own
  // layout (offsetTop, offsetLeft and their size), which a card pressed in mid-click doesn't skew, so it always lands
  // exactly on the card's edge, whether the cards stack or sit side by side in columns.
  const root = React.useRef<HTMLDivElement>(null)
  const top = useMotionValue(0)
  const height = useMotionValue(0)
  const left = useMotionValue(0)
  const width = useMotionValue(0)
  const shown = useMotionValue(0)
  const measured = React.useRef(false)
  React.useLayoutEffect(() => {
    const node = root.current
    if (variant !== "cards" || !node) return
    const place = (glide: boolean) => {
      const card = Array.from(node.querySelectorAll<HTMLElement>("[data-slot=radio-card]")).find((el) => el.dataset.value === picked)
      if (!card) return shown.set(0)
      if (!glide || !measured.current || reduced) {
        top.jump(card.offsetTop)
        height.jump(card.offsetHeight)
        left.jump(card.offsetLeft)
        width.jump(card.offsetWidth)
      } else {
        animate(top, card.offsetTop, spring.move)
        animate(height, card.offsetHeight, spring.move)
        animate(left, card.offsetLeft, spring.move)
        animate(width, card.offsetWidth, spring.move)
      }
      measured.current = true
      shown.set(1)
    }
    place(true)
    // A card growing or the group rewrapping: follow at once. Only on a real change of size: an observer also calls
    // back as soon as it starts, which would cut the glide just begun short.
    let size = `${node.offsetWidth}x${node.offsetHeight}`
    const observer = new ResizeObserver(() => {
      const now = `${node.offsetWidth}x${node.offsetHeight}`
      if (now === size) return
      size = now
      place(false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [picked, variant, reduced, top, height, left, width, shown])

  // The hover: one soft layer under the cards, gliding from card to card without going out between them; it fades
  // where it is when the pointer leaves the group.
  const hover = useHoverPill<string>(reduced)
  const hoverTop = useMotionValue(0)
  const hoverHeight = useMotionValue(0)
  const hoverLeft = useMotionValue(0)
  const hoverWidth = useMotionValue(0)
  const hoverCard = (card: HTMLElement, key: string) => {
    // Showing already, it glides to the new card; coming back after it faded, it starts right there.
    if (hover.opacity.get() < 0.05 || reduced) {
      hoverTop.jump(card.offsetTop)
      hoverHeight.jump(card.offsetHeight)
      hoverLeft.jump(card.offsetLeft)
      hoverWidth.jump(card.offsetWidth)
    } else {
      animate(hoverTop, card.offsetTop, spring.move)
      animate(hoverHeight, card.offsetHeight, spring.move)
      animate(hoverLeft, card.offsetLeft, spring.move)
      animate(hoverWidth, card.offsetWidth, spring.move)
    }
    hover.enter(key)
  }

  return (
    <RadioGroupPrimitive.Root
      ref={root}
      onPointerLeave={variant === "cards" ? hover.leave : undefined}
      data-slot="radio-group"
      value={picked}
      onValueChange={(next) => {
        if (value === undefined) setOwn(next)
        onValueChange?.(next)
      }}
      className={cn("relative isolate grid gap-3", className, classNames?.group)}
      {...props}
    >
      {variant === "cards" && (
        // Under the cards' content, over the group's background.
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -z-10 rounded-lg bg-accent/50"
          style={{ top: hoverTop, height: hoverHeight, left: hoverLeft, width: hoverWidth, opacity: hover.opacity }}
        />
      )}
      {variant === "cards" && (
        // Over the cards, so it covers their borders; its tint is faint enough to leave their text clear.
        <motion.span
          aria-hidden
          className={cn("pointer-events-none absolute z-10 rounded-lg border", frameColors[color])}
          style={{ top, height, left, width, opacity: shown }}
        />
      )}
      {options.map((option) => {
        const { value: itemValue, label = itemValue, description, icon, disabled } = typeof option === "string" ? { value: option } : option
        const id = `${groupId}-${itemValue}`
        const radio = (extra?: string, describedBy?: string) => (
          <Radio
            id={id}
            value={itemValue}
            disabled={disabled}
            picked={picked === itemValue}
            reduced={reduced}
            aria-describedby={describedBy}
            className={cn(radioColors[color], extra, classNames?.radio)}
          />
        )

        if (variant === "cards") {
          const descriptionId = description ? `${id}-description` : undefined
          return (
            <FieldLabel
              key={itemValue}
              htmlFor={id}
              data-slot="radio-card"
              data-value={itemValue}
              onPointerEnter={(event: React.PointerEvent<HTMLLabelElement>) => !disabled && hoverCard(event.currentTarget, itemValue)}
              asChild
              // On the label, which merges them with its own; the motion element below only takes them.
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-4 font-normal transition-colors",
                "has-focus-visible:ring-2 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50",
                classNames?.item
              )}
            >
              <motion.label whileTap={reduced || disabled ? undefined : { scale: 0.985 }} transition={spring.press}>
                {icon && <span className="flex shrink-0 text-muted-foreground [&_svg]:size-5">{icon}</span>}
                <span className="grid min-w-0 flex-1 gap-1">
                  <span className="leading-4 font-medium">{label}</span>
                  {description && (
                    <span id={descriptionId} className="text-xs text-muted-foreground">
                      {description}
                    </span>
                  )}
                </span>
                {/* Hidden, the radio still takes focus and the arrow keys. */}
                {radio(indicator ? undefined : "sr-only", descriptionId)}
              </motion.label>
            </FieldLabel>
          )
        }

        return (
          <ChoiceField renderMessages={motionMessages} key={itemValue} id={id} label={label} description={description} disabled={disabled} leading="leading-4" classNames={{ root: classNames?.item }}>
            {(choice) => radio(undefined, choice["aria-describedby"])}
          </ChoiceField>
        )
      })}
    </RadioGroupPrimitive.Root>
  )
}

function Radio({
  className,
  picked,
  reduced,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item> & { picked: boolean; reduced: boolean }) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "grid aspect-square size-4 shrink-0 place-items-center rounded-full border border-input shadow-xs transition-[color,border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 in-[[aria-invalid=true]]:border-destructive",
        className
      )}
      {...props}
    >
      {/* Always there, so the dot can shrink away as well as spring in. */}
      <RadioGroupPrimitive.Indicator forceMount data-slot="radio-group-indicator" asChild>
        <motion.span
          className="size-2 rounded-full bg-current"
          initial={false}
          animate={picked ? { scale: 1, opacity: 1 } : { scale: reduced ? 1 : 0, opacity: 0 }}
          transition={
            reduced
              ? { duration: duration.fast }
              : picked
                ? { ...spring.pop, opacity: { duration: duration.fast, ease: ease.enter } }
                : { duration: duration.fast, ease: ease.exit }
          }
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
