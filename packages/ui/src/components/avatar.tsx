"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"

import { cn } from "../lib/utils"
import { Tooltip } from "./tooltip"

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl"
type AvatarStatus = "online" | "away" | "busy" | "offline"

const sizes: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-16 text-lg",
}

const statusColors: Record<AvatarStatus, string> = {
  online: "bg-success",
  away: "bg-warning",
  busy: "bg-destructive",
  offline: "bg-muted-foreground",
}

/** "Olivia Martin" → "OM"; one name gives one letter. */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

type AvatarProps = Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, "children"> & {
  src?: string
  /** Who it is: the image's alt text, and the initials shown until (or instead of) the image. */
  name?: string
  /** The image's alt text, name by default. "" when the name is written beside the avatar, so it isn't read twice. */
  alt?: string
  /** Replaces the initials, e.g. an icon. */
  fallback?: React.ReactNode
  size?: AvatarSize
  shape?: "circle" | "square"
  /** A dot in the corner; its meaning is read out too. */
  status?: AvatarStatus
  classNames?: { image?: string; fallback?: string; status?: string }
}

/** A person's picture in one tag, with their initials while it loads or when there's none. */
function Avatar({ src, name, alt = name, fallback, size = "md", shape = "circle", status, className, classNames, ...props }: AvatarProps) {
  const radius = shape === "circle" ? "rounded-full" : "rounded-md"
  return (
    // With alt="", the name is written beside it: the avatar is decoration, so its initials aren't read out either.
    <span data-slot="avatar" aria-hidden={alt === "" || undefined} className={cn("relative inline-flex shrink-0", radius, sizes[size], className)}>
      <AvatarPrimitive.Root className={cn("flex size-full overflow-hidden", radius)} {...props}>
        {src && (
          <AvatarPrimitive.Image
            src={src}
            alt={alt ?? ""}
            // Fades in once loaded, over the fallback, instead of popping.
            className={cn("aspect-square size-full animate-in object-cover fade-in-0 duration-(--duration-standard) ease-enter", classNames?.image)}
          />
        )}
        <AvatarPrimitive.Fallback
          className={cn("flex size-full items-center justify-center bg-muted font-medium text-muted-foreground", radius, classNames?.fallback)}
        >
          {fallback ?? (name ? initials(name) : null)}
          {/* With no image, the initials alone don't say who it is. */}
          {!src && alt && <span className="sr-only">{alt}</span>}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            "absolute end-0 bottom-0 size-[28%] min-w-2 rounded-full ring-2 ring-card",
            statusColors[status],
            classNames?.status
          )}
        >
          <span className="sr-only">{status}</span>
        </span>
      )}
    </span>
  )
}

type AvatarGroupProps = Omit<React.ComponentProps<"div">, "children"> & {
  items: (Pick<AvatarProps, "src" | "name" | "alt" | "fallback"> & { id?: string | number })[]
  /** Avatars shown before the rest collapse into "+N". */
  max?: number
  size?: AvatarSize
  /** Each avatar shows its name in a tooltip on hover or keyboard focus, and "+N" lists the rest. */
  showNames?: boolean
}

/**
 * Avatars overlapping in a row, in one tag. Shows the first `max` and a "+N" for the rest; give it a label for screen
 * readers, e.g. aria-label="5 people on this board".
 */
function AvatarGroup({ items, max, size = "md", showNames = false, className, ...props }: AvatarGroupProps) {
  const shown = max === undefined ? items : items.slice(0, max)
  const rest = items.slice(shown.length)
  // The one under the pointer (or focused) rises a little and comes to the front of the stack.
  const lift =
    "relative rounded-full transition-transform duration-(--duration-fast) ease-standard outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring motion-safe:hover:-translate-y-0.5"
  const more = rest.length > 0 && (
    <span
      tabIndex={showNames ? 0 : undefined}
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted font-medium text-muted-foreground tabular-nums ring-2 ring-card",
        lift,
        sizes[size]
      )}
    >
      +{rest.length}
    </span>
  )
  const restNames = rest.map((item) => item.name).filter(Boolean)
  return (
    <div data-slot="avatar-group" role="group" className={cn("flex items-center -space-x-2", className)} {...props}>
      {shown.map(({ id, ...item }, i) =>
        showNames && item.name ? (
          <Tooltip key={id ?? i} content={item.name}>
            {/* flex, not inline: an inline wrapper sits on a line of text, so an avatar with a picture and one with
                initials (or the +N) would settle at different heights. */}
            <span tabIndex={0} className={cn("flex", lift)}>
              <Avatar {...item} size={size} className="ring-2 ring-card" />
            </span>
          </Tooltip>
        ) : (
          <Avatar key={id ?? i} {...item} size={size} className={cn("ring-2 ring-card", lift)} />
        )
      )}
      {more && showNames && restNames.length > 0 ? (
        <Tooltip content={<span className="block max-w-56">{restNames.join(", ")}</span>}>{more}</Tooltip>
      ) : (
        more
      )}
    </div>
  )
}

export { Avatar, AvatarGroup, type AvatarProps, type AvatarGroupProps, type AvatarSize, type AvatarStatus }
