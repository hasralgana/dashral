"use client"

import * as React from "react"
import { AspectRatio as AspectRatioPrimitive } from "radix-ui"

import { cn } from "../lib/utils"

type AspectRatioProps = Omit<React.ComponentProps<typeof AspectRatioPrimitive.Root>, "ratio"> & {
  /** Width over height: 16 / 9 (default), 4 / 3, 1 for a square. */
  ratio?: number
  /** The box's classes, e.g. a radius or a background. Its children fill it. */
  className?: string
  /** The classes of the wrapper that holds the ratio, e.g. a width. */
  wrapperClassName?: string
}

/**
 * A box that keeps its shape as it grows and shrinks, for an image, a video or a map: `<AspectRatio ratio={4 / 3}>`. An
 * <img> or <video> inside fills it and is cropped to fit (object-cover), unless you give it classes of your own.
 */
function AspectRatio({ ratio = 16 / 9, className, wrapperClassName, style, ...props }: AspectRatioProps) {
  return (
    // Radix wraps the box in a div that holds the ratio with padding; that one takes the width.
    <div data-slot="aspect-ratio-wrapper" className={cn("w-full", wrapperClassName)}>
      <AspectRatioPrimitive.Root
        data-slot="aspect-ratio"
        ratio={ratio}
        style={style}
        className={cn(
          "overflow-hidden [&>img:not([class])]:size-full [&>img:not([class])]:object-cover [&>video:not([class])]:size-full [&>video:not([class])]:object-cover",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { AspectRatio, type AspectRatioProps }
