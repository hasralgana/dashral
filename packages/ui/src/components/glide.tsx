import * as React from "react"

type GlideProps = Omit<React.HTMLAttributes<HTMLElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  /** The element it is. */
  as?: "div" | "span" | "li"
  /**
   * What glides when the layout changes: everything (true), only where it is ("position", for text that would
   * stretch), or only its size ("size").
   */
  layout?: boolean | "position" | "size"
  /** One name shared by elements in different places, such as a highlight: when it moves to another, it glides there. */
  layoutId?: string
}

/**
 * An element that glides to its new place and size when the layout changes, in the Motion edition: a row moving as the
 * list is sorted, a card as the view turns from list to grid, a highlight moving from one card to another (layoutId).
 * Here, without motion, it's simply the element, and it moves at once.
 */
function Glide({ as: Tag = "div", layout: _layout, layoutId: _layoutId, ...props }: GlideProps) {
  return <Tag data-slot="glide" {...props} />
}

export { Glide, type GlideProps }
