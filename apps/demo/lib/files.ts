// Demo data for the Files page: one folder tree that the folder list, the file table and the storage treemap all read,
// so their numbers always agree. Replace it with your storage service's listing.

export type FileKind = "image" | "video" | "audio" | "document" | "spreadsheet" | "code" | "archive"

export type FileEntry = { type: "file"; id: string; name: string; kind: FileKind; size: number; modified: string; owner: string }
/** Folders named by the app (not by a person) have a `key`: their name in messages → files.names, in the reader's language. */
export type FolderEntry = { type: "folder"; id: string; name: string; key?: FolderKey; modified: string; owner: string; children: Entry[] }
export type Entry = FileEntry | FolderEntry

const GB = 1e9
const MB = 1e6

const file = (folder: string, name: string, kind: FileKind, size: number, modified: string, owner = "Olivia Martin"): FileEntry => ({
  type: "file",
  id: `${folder}/${name}`,
  name,
  kind,
  size,
  modified,
  owner,
})
const folderKeys = ["root", "media", "videos", "photos", "audio", "projects", "documents", "invoices", "contracts", "backups"] as const
export type FolderKey = (typeof folderKeys)[number]
const isFolderKey = (value: string): value is FolderKey => (folderKeys as readonly string[]).includes(value)

const folder = (id: string, name: string, modified: string, owner: string, children: Entry[]): FolderEntry => ({
  type: "folder",
  id,
  name,
  key: [id.split("/").at(-1)!].find(isFolderKey),
  modified,
  owner,
  children,
})

export const quota = 1000 * GB

export const root: FolderEntry = folder("root", "My files", "2026-10-14", "Olivia Martin", [
  folder("media", "Media", "2026-10-13", "Olivia Martin", [
    folder("media/videos", "Videos", "2026-10-13", "Liam Johnson", [
      file("media/videos", "product-launch.mp4", "video", 64.2 * GB, "2026-10-13", "Liam Johnson"),
      file("media/videos", "onboarding-walkthrough.mp4", "video", 48.7 * GB, "2026-09-28", "Liam Johnson"),
      file("media/videos", "customer-stories.mp4", "video", 39.5 * GB, "2026-08-19", "Liam Johnson"),
      file("media/videos", "team-offsite.mov", "video", 29.6 * GB, "2026-07-02", "Sofia Davis"),
    ]),
    folder("media/photos", "Photos", "2026-10-09", "Sofia Davis", [
      file("media/photos", "lookbook-autumn.zip", "archive", 41.3 * GB, "2026-10-09", "Sofia Davis"),
      file("media/photos", "product-shots-raw.zip", "archive", 36.8 * GB, "2026-09-15", "Sofia Davis"),
      file("media/photos", "hero-banner.png", "image", 18.4 * MB, "2026-10-02", "Sofia Davis"),
      file("media/photos", "team-portraits.zip", "archive", 17.9 * GB, "2026-06-21", "Sofia Davis"),
    ]),
    folder("media/audio", "Audio", "2026-09-30", "Budi Santoso", [
      file("media/audio", "podcast-episodes.zip", "archive", 32.6 * GB, "2026-09-30", "Budi Santoso"),
      file("media/audio", "brand-jingle.wav", "audio", 84.1 * MB, "2026-05-11", "Budi Santoso"),
      file("media/audio", "voiceovers.zip", "archive", 8.3 * GB, "2026-08-04", "Budi Santoso"),
    ]),
  ]),
  folder("projects", "Projects", "2026-10-14", "Liam Johnson", [
    folder("projects/dashral", "dashral", "2026-10-14", "Liam Johnson", [
      file("projects/dashral", "node_modules.tar.gz", "archive", 38.2 * GB, "2026-10-14", "Liam Johnson"),
      file("projects/dashral", "build-cache.tar.gz", "archive", 21.4 * GB, "2026-10-12", "Liam Johnson"),
      file("projects/dashral", "README.md", "code", 12.4 * 1e3, "2026-10-14", "Liam Johnson"),
      file("projects/dashral", "design-system.fig", "image", 4.6 * GB, "2026-10-10", "Sofia Davis"),
    ]),
    folder("projects/website", "website", "2026-10-11", "Liam Johnson", [
      file("projects/website", "assets.zip", "archive", 26.1 * GB, "2026-10-11", "Liam Johnson"),
      file("projects/website", "analytics-export.csv", "spreadsheet", 11.9 * GB, "2026-10-01", "Olivia Martin"),
    ]),
    folder("projects/mobile-app", "mobile-app", "2026-09-22", "Budi Santoso", [
      file("projects/mobile-app", "release-builds.zip", "archive", 22.8 * GB, "2026-09-22", "Budi Santoso"),
      file("projects/mobile-app", "screenshots.zip", "archive", 4.2 * GB, "2026-09-20", "Budi Santoso"),
    ]),
  ]),
  folder("documents", "Documents", "2026-10-12", "Olivia Martin", [
    folder("documents/invoices", "Invoices", "2026-10-12", "Olivia Martin", [
      file("documents/invoices", "invoices-2026.zip", "archive", 12.7 * GB, "2026-10-12"),
      file("documents/invoices", "invoices-2025.zip", "archive", 5.3 * GB, "2026-01-08"),
    ]),
    folder("documents/contracts", "Contracts", "2026-09-18", "Olivia Martin", [
      file("documents/contracts", "vendor-agreements.pdf", "document", 6.1 * GB, "2026-09-18"),
      file("documents/contracts", "employment.zip", "archive", 2.9 * GB, "2026-07-30"),
    ]),
    file("documents", "quarterly-report-q3.pdf", "document", 3.8 * GB, "2026-10-05"),
    file("documents", "budget-2027.xlsx", "spreadsheet", 214 * MB, "2026-10-12"),
  ]),
  folder("backups", "Backups", "2026-10-14", "Olivia Martin", [
    file("backups", "database-2026-10-14.sql.gz", "archive", 24.6 * GB, "2026-10-14"),
    file("backups", "database-2026-10-07.sql.gz", "archive", 24.1 * GB, "2026-10-07"),
    file("backups", "database-2026-09-30.sql.gz", "archive", 23.3 * GB, "2026-09-30"),
  ]),
  file("root", "brand-guidelines.pdf", "document", 1.2 * GB, "2026-08-27"),
  file("root", "logo-pack.zip", "archive", 640 * MB, "2026-10-13", "Sofia Davis"),
])

export function sizeOf(entry: Entry): number {
  return entry.type === "file" ? entry.size : entry.children.reduce((sum, child) => sum + sizeOf(child), 0)
}

export function countFiles(entry: Entry): number {
  return entry.type === "file" ? 1 : entry.children.reduce((sum, child) => sum + countFiles(child), 0)
}

/** The folders from the top down to the one with this id, or [] when there's none. */
export function folderPath(id: string, from: FolderEntry = root): FolderEntry[] {
  if (from.id === id) return [from]
  for (const child of from.children) {
    if (child.type !== "folder") continue
    const path = folderPath(id, child)
    if (path.length) return [from, ...path]
  }
  return []
}

const units = [
  { size: 1e12, unit: "terabyte", digits: 2 },
  { size: GB, unit: "gigabyte", digits: 1 },
  { size: MB, unit: "megabyte", digits: 1 },
  { size: 1e3, unit: "kilobyte", digits: 0 },
]

/** "64.2 GB", "18.4 MB", "12 kB" — in the locale's words and digits (an Intl tag, e.g. "id-ID"). */
export function formatBytes(value: number, locale = "en-US") {
  const { size, unit, digits } = units.find((u) => value >= u.size) ?? units.at(-1)!
  return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short", maximumFractionDigits: digits }).format(value / size)
}
