"use client"

import * as React from "react"

import { cn } from "../lib/utils"

type KbdSize = "sm" | "default"

/** How a named key shows and is read out, on an Apple keyboard and elsewhere. */
const named: Record<string, { mac: string; other: string; macName: string; otherName: string }> = {
  mod: { mac: "⌘", other: "Ctrl", macName: "Command", otherName: "Control" },
  cmd: { mac: "⌘", other: "⌘", macName: "Command", otherName: "Command" },
  ctrl: { mac: "⌃", other: "Ctrl", macName: "Control", otherName: "Control" },
  alt: { mac: "⌥", other: "Alt", macName: "Option", otherName: "Alt" },
  shift: { mac: "⇧", other: "Shift", macName: "Shift", otherName: "Shift" },
  enter: { mac: "↵", other: "Enter", macName: "Return", otherName: "Enter" },
  esc: { mac: "Esc", other: "Esc", macName: "Escape", otherName: "Escape" },
  tab: { mac: "⇥", other: "Tab", macName: "Tab", otherName: "Tab" },
  backspace: { mac: "⌫", other: "⌫", macName: "Delete", otherName: "Backspace" },
  space: { mac: "Space", other: "Space", macName: "Space", otherName: "Space" },
  up: { mac: "↑", other: "↑", macName: "Up arrow", otherName: "Up arrow" },
  down: { mac: "↓", other: "↓", macName: "Down arrow", otherName: "Down arrow" },
  left: { mac: "←", other: "←", macName: "Left arrow", otherName: "Left arrow" },
  right: { mac: "→", other: "→", macName: "Right arrow", otherName: "Right arrow" },
}

const noSubscribe = () => () => {}
/** Whether this is an Apple device; on the server (and for the first paint) it guesses yes, as most of the kit's readers are. */
function useAppleKeyboard() {
  return React.useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
    () => true
  )
}

/** A key as it shows and as it's read out. */
function describeKey(key: string, apple: boolean) {
  const entry = named[key.toLowerCase()]
  if (!entry) return { label: key.length === 1 ? key.toUpperCase() : key, name: key.length === 1 ? key.toUpperCase() : key }
  return { label: apple ? entry.mac : entry.other, name: apple ? entry.macName : entry.otherName }
}

/** The classes for one key cap. */
const kbdKeyClass = (size: KbdSize) =>
  cn(
    "inline-flex min-w-5 items-center justify-center rounded border border-b-2 bg-muted px-1 font-sans font-medium text-muted-foreground",
    size === "sm" ? "h-5 text-[11px]" : "h-6 min-w-6 px-1.5 text-xs"
  )

type KbdProps = Omit<React.ComponentProps<"kbd">, "children"> & {
  /**
   * The keys of a shortcut, e.g. ["mod", "K"]. "mod" is ⌘ on a Mac and Ctrl elsewhere; "shift", "alt", "ctrl", "enter",
   * "esc", "tab", "backspace", "space" and the arrows ("up"…) show as their symbols and are read out by name.
   */
  keys?: string[]
  /** A single key, as text, when keys isn't given. */
  children?: React.ReactNode
  size?: KbdSize
}

/**
 * A key, or a shortcut of several, as on a keyboard: <Kbd keys={["mod", "K"]} /> shows ⌘ K on a Mac and Ctrl K
 * elsewhere, and screen readers hear "Command K". Inside a button or a menu it says what the keys do the same as.
 */
function Kbd({ keys, children, size = "default", className, ...props }: KbdProps) {
  const apple = useAppleKeyboard()
  if (!keys) {
    return (
      <kbd data-slot="kbd" className={cn(kbdKeyClass(size), className)} {...props}>
        {children}
      </kbd>
    )
  }
  const described = keys.map((key) => describeKey(key, apple))
  return (
    // Nested kbd for a combination, as HTML has it; read out as words ("Command K"), not symbols.
    <kbd data-slot="kbd" aria-label={described.map((key) => key.name).join(" ")} className={cn("inline-flex items-center gap-1", className)} {...props}>
      {described.map((key, i) => (
        <kbd key={i} aria-hidden className={kbdKeyClass(size)}>
          {key.label}
        </kbd>
      ))}
    </kbd>
  )
}

// Building blocks for a Kbd of your own (the motion edition uses them).
export { Kbd, describeKey, useAppleKeyboard, kbdKeyClass, type KbdProps, type KbdSize }
