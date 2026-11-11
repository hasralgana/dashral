"use client"

// Loading the next rows of a long list as its end comes near (Data Table and List, scrolled with virtual). One load
// at a time; a load that throws waits for "Try again" rather than retrying on its own.

import * as React from "react"

export type LoadMoreStatus = "idle" | "loading" | "error"

/**
 * Calls onLoadMore when `near` (the end is in view) while there's more to load, once at a time. It doesn't call again
 * for the same row count, so a load that adds nothing doesn't loop: it waits for the rows to change, or for retry.
 */
export function useLoadMore({
  near,
  count,
  hasMore,
  onLoadMore,
}: {
  near: boolean
  /** How many rows there are now. */
  count: number
  hasMore: boolean
  onLoadMore?: () => Promise<void> | void
}) {
  const [status, setStatus] = React.useState<LoadMoreStatus>("idle")
  const running = React.useRef(false)
  const loadedAt = React.useRef<number | null>(null)
  const latest = React.useRef(onLoadMore)
  latest.current = onLoadMore

  const load = React.useCallback(async (force = false) => {
    if (!latest.current || running.current) return
    if (!force && loadedAt.current === count) return
    running.current = true
    loadedAt.current = count
    setStatus("loading")
    try {
      await latest.current()
      setStatus("idle")
    } catch {
      setStatus("error")
    } finally {
      running.current = false
    }
  }, [count])

  React.useEffect(() => {
    if (near && hasMore && status === "idle") void load()
  }, [near, hasMore, status, load])

  return { status, retry: () => void load(true) }
}
