// Static demo data for Classic's Monitoring page (app/(dashboard)/monitoring): an app's services, how fast they answer
// and the log lines they write. Replace it with your own metrics and log store.

export type Level = "info" | "warn" | "error" | "debug"
export const services = ["api", "web", "worker", "database"] as const
export type Service = (typeof services)[number]
export type ServiceHealth = "operational" | "degraded"

export const serviceStatus: { service: Service; health: ServiceHealth; uptime: number }[] = [
  { service: "api", health: "operational", uptime: 0.9998 },
  { service: "web", health: "operational", uptime: 0.9999 },
  { service: "worker", health: "degraded", uptime: 0.9961 },
  { service: "database", health: "operational", uptime: 0.9997 },
]

export type LogEntry = {
  id: string
  /** "HH:MM:SS", today. */
  time: string
  level: Level
  service: Service
  message: string
  /** The request behind it, for the API and the web app. */
  request?: { method: string; path: string; status: number; ms: number }
}

// A small, seeded random source, so the server and the browser make the same lines.
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const requests: [string, string][] = [
  ["GET", "/v1/orders"],
  ["GET", "/v1/customers/:id"],
  ["POST", "/v1/invoices"],
  ["GET", "/dashboard"],
  ["POST", "/v1/webhooks/payments"],
  ["GET", "/v1/reports/revenue"],
  ["PATCH", "/v1/settings"],
]
const workerLines = [
  ["info", "Sent 248 weekly reports"],
  ["info", "Synced 1,204 orders from the store"],
  ["warn", "Retrying export job (attempt 2 of 5)"],
  ["error", "Export job failed: storage timeout after 30s"],
  ["debug", "Queue depth 18, 4 workers busy"],
] as const
const databaseLines = [
  ["info", "Checkpoint complete: 412 buffers written"],
  ["warn", "Slow query (1,420 ms) on orders by customer"],
  ["debug", "Connection pool 34 of 100 in use"],
] as const

/** One log line, made from a number: the same number always makes the same line. */
export function makeLog(n: number, time: string): LogEntry {
  const random = seeded(n * 7919 + 3)
  const pick = random()
  const id = `log_${(900000 + n).toString(36)}`
  if (pick < 0.62) {
    const [method, path] = requests[Math.floor(random() * requests.length)]!
    const roll = random()
    const status = roll > 0.96 ? 500 : roll > 0.9 ? 429 : roll > 0.84 ? 404 : method === "POST" ? 201 : 200
    const ms = Math.round(status >= 500 ? 900 + random() * 2400 : 18 + random() * random() * 420)
    const level: Level = status >= 500 ? "error" : status >= 400 ? "warn" : "info"
    const service: Service = path.startsWith("/v1") ? "api" : "web"
    return { id, time, level, service, message: `${method} ${path} ${status} in ${ms} ms`, request: { method, path, status, ms } }
  }
  const [level, message] = pick < 0.85 ? workerLines[Math.floor(random() * workerLines.length)]! : databaseLines[Math.floor(random() * databaseLines.length)]!
  return { id, time, level, service: pick < 0.85 ? "worker" : "database", message }
}

const clock = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((part) => String(part).padStart(2, "0")).join(":")

/** The sample's "now" (10:30:00), and the last 120 lines before it, newest first. */
export const monitoringNow = 10 * 3600 + 30 * 60
export const logs: LogEntry[] = Array.from({ length: 120 }, (_, i) => makeLog(120 - i, clock(monitoringNow - i * 37)))
export { clock }

/** Response times over the last 24 hours, hour by hour: the middle request (p50) and the slow tail (p95), in ms. */
export const latency = (() => {
  const random = seeded(21)
  return Array.from({ length: 24 }, (_, i) => {
    const hour = (11 + i) % 24
    const busy = hour >= 9 && hour <= 17 ? 1.35 : 1
    const spike = i === 19 ? 2.2 : 1
    return {
      hour: `${String(hour).padStart(2, "0")}:00`,
      p50: Math.round((42 + random() * 10) * busy),
      p95: Math.round((160 + random() * 60) * busy * spike),
    }
  })
})()
