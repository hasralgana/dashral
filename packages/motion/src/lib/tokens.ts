// The kit's motion tokens for motion/react, which takes numbers, not CSS variables. They mirror globals.css in
// @dashral/ui (--duration-*, --ease-*): change one, change the other. Durations are in seconds, as motion/react has
// them; eases are the same cubic-bezier points.

export const duration = {
  /** --duration-fast: hovers, presses, color changes. */
  fast: 0.16,
  /** --duration-standard: menus, popovers, toggles. */
  standard: 0.24,
  /** --duration-considered: sliding highlights, panels, things that travel. */
  considered: 0.48,
} as const

export const ease = {
  /** --ease-standard: things already on screen moving or changing. */
  standard: [0.2, 0, 0, 1],
  /** --ease-enter: arriving, fast then settling. */
  enter: [0, 0, 0, 1],
  /** --ease-exit: leaving, gathering speed. */
  exit: [0.3, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export const spring = {
  /** A press and its release: quick, and it never overshoots, so a button doesn't wobble under the finger. */
  press: { type: "spring", visualDuration: 0.16, bounce: 0 },
  /** Sizes and positions following new content (a label changing): the considered glide, without overshoot. */
  glide: { type: "spring", visualDuration: 0.48, bounce: 0 },
  /** Something moving to a new place on screen (a tab's highlight, a switch's thumb): a touch of overshoot to settle. */
  move: { type: "spring", visualDuration: 0.4, bounce: 0.12 },
  /** A menu, popover, tooltip or dialog arriving: --duration-standard with a hint of overshoot, quick to settle. */
  appear: { type: "spring", visualDuration: 0.24, bounce: 0.1 },
  /** --ease-spring: a small overshoot, for something arriving that should feel alive (an icon popping in). */
  pop: { type: "spring", visualDuration: 0.48, bounce: 0.15 },
} as const
