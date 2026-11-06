import * as React from "react"

import { cn } from "../lib/utils"

type ButtonGroupProps = React.ComponentProps<"div"> & {
  /** Side by side (default) or one above the other. */
  orientation?: "horizontal" | "vertical"
  /**
   * Joined (default): the buttons share their edges, as one control, with a thin line between filled ones. Off, they
   * stay apart with a small gap, still grouped for screen readers.
   */
  attached?: boolean
  /** Names the group for screen readers, e.g. "Text alignment". */
  "aria-label"?: string
}

// Joined buttons: square inner corners, overlapping borders, and the focused one on top so its ring shows whole. A
// button without a border of its own (solid, soft, ghost) gets a thin line in its text color at the joint instead.
const joined = {
  horizontal: [
    "[&>*]:rounded-none [&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md",
    "[&>[class~=border]:not(:first-child)]:-ms-px",
    "[&>*:not(:first-child):not([class~=border])]:relative [&>*:not(:first-child):not([class~=border])]:before:pointer-events-none [&>*:not(:first-child):not([class~=border])]:before:absolute [&>*:not(:first-child):not([class~=border])]:before:inset-y-0 [&>*:not(:first-child):not([class~=border])]:before:start-0 [&>*:not(:first-child):not([class~=border])]:before:w-px [&>*:not(:first-child):not([class~=border])]:before:bg-current [&>*:not(:first-child):not([class~=border])]:before:opacity-20",
  ],
  vertical: [
    "flex-col [&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md",
    "[&>[class~=border]:not(:first-child)]:-mt-px",
    "[&>*:not(:first-child):not([class~=border])]:relative [&>*:not(:first-child):not([class~=border])]:before:pointer-events-none [&>*:not(:first-child):not([class~=border])]:before:absolute [&>*:not(:first-child):not([class~=border])]:before:inset-x-0 [&>*:not(:first-child):not([class~=border])]:before:top-0 [&>*:not(:first-child):not([class~=border])]:before:h-px [&>*:not(:first-child):not([class~=border])]:before:bg-current [&>*:not(:first-child):not([class~=border])]:before:opacity-20",
  ],
}

/**
 * Buttons that belong together, joined into one control: `<ButtonGroup aria-label="View"><Button …/><Button …/></ButtonGroup>`.
 * Put any Button in it, a menu's trigger included (a split button), and give each the same variant and size. For one
 * choice among options that stays pressed, use SegmentedControl or ToggleGroup.
 */
function ButtonGroup({ orientation = "horizontal", attached = true, className, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(
        "inline-flex w-fit items-stretch [&>*:focus-visible]:z-10",
        attached ? joined[orientation] : [orientation === "vertical" ? "flex-col" : "flex-wrap", "gap-2"],
        className
      )}
      {...props}
    />
  )
}

export { ButtonGroup, type ButtonGroupProps }
