import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "../lib/utils"

const widths = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
}

// Padded, the size is the content's width and the padding sits outside it, so a padded Container lines up with the
// blocks, which pad their section and cap the content inside it (px-4 sm:px-6 around max-w-6xl).
const paddedWidths = {
  sm: "max-w-[calc(var(--container-2xl)+2rem)] sm:max-w-[calc(var(--container-2xl)+3rem)]",
  md: "max-w-[calc(var(--container-4xl)+2rem)] sm:max-w-[calc(var(--container-4xl)+3rem)]",
  lg: "max-w-[calc(var(--container-6xl)+2rem)] sm:max-w-[calc(var(--container-6xl)+3rem)]",
  xl: "max-w-[calc(var(--container-7xl)+2rem)] sm:max-w-[calc(var(--container-7xl)+3rem)]",
  full: "max-w-none",
}

type ContainerProps = React.ComponentProps<"div"> & {
  /** How wide the content gets: sm (42rem) for reading, md (56rem), lg (72rem, the default) for most pages, xl (80rem), full. */
  size?: keyof typeof widths
  /** The room at its sides, outside the size, so content never touches the screen's edge on a phone: 16px, 24px from sm up. On by default. */
  padded?: boolean
  /** Its classes and width on your own element instead of a div, e.g. a <main> or an <article>. */
  asChild?: boolean
}

/**
 * The width of a page's content, in one tag: `<Container size="md">…</Container>`. Centred, as wide as the size and
 * no wider, with room at the sides on a phone. The frame of every page, and of a Section's content.
 */
function Container({ size = "lg", padded = true, asChild = false, className, ...props }: ContainerProps) {
  const Comp = asChild ? Slot.Root : "div"
  return <Comp data-slot="container" data-size={size} className={cn("mx-auto w-full", padded ? [paddedWidths[size], "px-4 sm:px-6"] : widths[size], className)} {...props} />
}

export { Container, type ContainerProps }
