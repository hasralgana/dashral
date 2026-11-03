"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Search,
  Upload,
  type LucideIcon,
} from "lucide-react"
import { BarList } from "@dashral/ui/components/bar-list"
import { Breadcrumb } from "@dashral/ui/components/breadcrumb"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Dialog, DialogClose } from "@dashral/ui/components/dialog"
import { EmptyState } from "@dashral/ui/components/empty-state"
import { FileDropzone } from "@dashral/ui/components/file-dropzone"
import { Input } from "@dashral/ui/components/input"
import { Progress } from "@dashral/ui/components/progress"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@dashral/ui/components/table"
import { toast } from "@dashral/ui/components/toast"
import { Treemap, type TreemapDatum } from "@dashral/ui/components/treemap"
import { TreeView, type TreeItem } from "@dashral/ui/components/tree-view"

import {
  countFiles,
  folderPath,
  formatBytes,
  quota,
  root as demoRoot,
  sizeOf,
  type Entry,
  type FileKind,
  type FolderEntry,
} from "@/lib/files"
import { localeInfo } from "@/lib/i18n"
import { useFormats } from "@/lib/use-formats"

// Their names are in messages → files.kinds.
const kinds: Record<FileKind, { icon: LucideIcon; color: string }> = {
  video: { icon: FileVideo, color: "var(--chart-1)" },
  archive: { icon: FileArchive, color: "var(--chart-2)" },
  image: { icon: FileImage, color: "var(--chart-3)" },
  audio: { icon: FileAudio, color: "var(--chart-4)" },
  document: { icon: FileText, color: "var(--chart-5)" },
  spreadsheet: { icon: FileSpreadsheet, color: "var(--chart-2)" },
  code: { icon: FileCode, color: "var(--chart-3)" },
}

const hrefOf = (id: string) => (id === "root" ? "/files" : `/files?folder=${encodeURIComponent(id)}`)

/** What a picked file probably is, from its type and name. */
function kindOf(file: File): FileKind {
  const [type] = file.type.split("/")
  if (type === "video" || type === "image" || type === "audio") return type
  if (/\.(zip|gz|tar|rar|7z)$/i.test(file.name)) return "archive"
  if (/\.(csv|xlsx?|numbers)$/i.test(file.name)) return "spreadsheet"
  if (/\.(m?[jt]sx?|json|md|css|html)$/i.test(file.name)) return "code"
  return "document"
}

/** The folder with these new files added (a copy; the rest of the tree is shared). */
function addFiles(folder: FolderEntry, id: string, files: Entry[]): FolderEntry {
  if (folder.id === id) return { ...folder, children: [...folder.children, ...files] }
  return { ...folder, children: folder.children.map((child) => (child.type === "folder" ? addFiles(child, id, files) : child)) }
}

function toTreeItem(folder: FolderEntry, nameOf: (entry: Entry) => string): TreeItem {
  return {
    id: folder.id,
    label: nameOf(folder),
    icon: <Folder />,
    openIcon: <FolderOpen />,
    suffix: countFiles(folder),
    children: folder.children.filter((child) => child.type === "folder").map((child) => toTreeItem(child, nameOf)),
  }
}

function toTreemap(entry: Entry, nameOf: (entry: Entry) => string): TreemapDatum {
  return entry.type === "file"
    ? { label: entry.name, value: entry.size / 1e9 }
    : { label: nameOf(entry), children: entry.children.map((child) => toTreemap(child, nameOf)) }
}

/** The Files page: storage use (by folder and by type), the folder tree and the open folder's contents. */
export function FilesView({ folderId }: { folderId: string }) {
  const t = useTranslations("files")
  const intl = localeInfo[useLocale()].intl
  const format = useFormats()
  const bytes = (value: number) => formatBytes(value, intl)
  const nameOf = (entry: Entry) => (entry.type === "folder" && entry.key ? t(`names.${entry.key}`) : entry.name)
  const router = useRouter()
  // Uploads stay in this tab only: it's a demo with no server.
  const [root, setRoot] = useState(demoRoot)
  const path = folderPath(folderId, root)
  const current = path.at(-1) ?? root
  const trail = path.length ? path : [root]

  const [filter, setFilter] = useState("")
  // The folders on the way to the open one are always open in the tree.
  const [expanded, setExpanded] = useState(() => ["root", ...trail.map((f) => f.id)])
  const expandedWithTrail = [...new Set([...expanded, ...trail.slice(0, -1).map((f) => f.id)])]

  const used = sizeOf(root)
  // nameOf changes with the language (t), not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const treeItems = useMemo(() => [toTreeItem(root, nameOf)], [root, t])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const treemap = useMemo(() => root.children.map((child) => toTreemap(child, nameOf)), [root, t])
  const byKind = useMemo(() => {
    const totals = new Map<FileKind, number>()
    const walk = (entry: Entry) =>
      entry.type === "file" ? totals.set(entry.kind, (totals.get(entry.kind) ?? 0) + entry.size) : entry.children.forEach(walk)
    walk(root)
    return [...totals].sort((a, b) => b[1] - a[1])
  }, [root])

  const rows = [...current.children].sort((a, b) =>
    a.type === b.type ? nameOf(a).localeCompare(nameOf(b), intl) : a.type === "folder" ? -1 : 1
  )

  const [uploadOpen, setUploadOpen] = useState(false)
  const [picked, setPicked] = useState<File[]>([])
  const upload = () => {
    const today = new Date().toISOString().slice(0, 10)
    const added = picked.map(
      (f): Entry => ({ type: "file", id: `${current.id}/${f.name}-${crypto.randomUUID()}`, name: f.name, kind: kindOf(f), size: f.size, modified: today, owner: t("you") })
    )
    setRoot((r) => addFiles(r, current.id, added))
    toast.success(t("uploaded", { count: added.length, name: added[0]!.name, folder: nameOf(current) }), {
      description: t("uploadedDemo"),
    })
    setPicked([])
    setUploadOpen(false)
  }

  return (
    <>
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3" aria-label={t("storage")}>
        <Card
          title={t("storage")}
          description={t("storageDescription")}
          action={
            <>
              <p className="text-xl font-semibold tabular-nums">{bytes(used)}</p>
              <p className="text-xs text-muted-foreground">{t("ofQuota", { quota: bytes(quota) })}</p>
            </>
          }
          className="xl:col-span-2"
          classNames={{ action: "text-end" }}
        >
          <Progress value={(used / quota) * 100} aria-label={t("storageUsed")} className="mb-4" />
          <Treemap
            aria-label={t("storageByFolder")}
            rootLabel={t("allFiles")}
            data={treemap}
            height={300}
            formatOptions={{ style: "unit", unit: "gigabyte", unitDisplay: "short", maximumFractionDigits: 1 }}
          />
        </Card>

        <Card title={t("byType")} description={t("byTypeDescription")}>
          <BarList
            aria-label={t("storageByType")}
            items={byKind.map(([kind, size]) => {
              const { icon: Icon, color } = kinds[kind]
              return { key: kind, label: t(`kinds.${kind}`), value: size, display: bytes(size), icon: <Icon />, color }
            })}
          />
        </Card>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]" aria-label={t("browse")}>
        <Card title={t("folders")} classNames={{ section: "gap-3", body: "grid gap-3" }}>
          <Input
            aria-label={t("filterFolders")}
            placeholder={t("filterPlaceholder")}
            prefix={<Search />}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <TreeView
            aria-label={t("folders")}
            items={treeItems}
            value={current.id}
            onValueChange={(id) => router.push(hrefOf(id), { scroll: false })}
            expanded={expandedWithTrail}
            onExpandedChange={setExpanded}
            filter={filter}
            // Rows start where the filter's text does (12px in), and each guide line stays under its chevron.
            classNames={{ row: "px-3", group: "ms-5" }}
          />
        </Card>

        <Card
          title={nameOf(current)}
          description={t("summary", { count: countFiles(current), size: bytes(sizeOf(current)) })}
          eyebrow={
            trail.length > 1 && (
              <Breadcrumb
                items={trail.map((f, i) => ({ label: nameOf(f), href: i < trail.length - 1 ? hrefOf(f.id) : undefined }))}
                linkAs={Link}
                aria-label={t("folder")}
              />
            )
          }
          action={
            <Dialog
              open={uploadOpen}
              onOpenChange={(open) => {
                setUploadOpen(open)
                if (!open) setPicked([])
              }}
              trigger={
                <Button>
                  <Upload /> {t("upload")}
                </Button>
              }
              title={t("uploadTo", { folder: nameOf(current) })}
              description={t("uploadHint")}
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="outline">{t("cancel")}</Button>
                  </DialogClose>
                  <Button disabled={picked.length === 0} onClick={upload}>
                    {picked.length > 0 ? t("uploadCount", { count: picked.length }) : t("upload")}
                  </Button>
                </>
              }
            >
              <FileDropzone value={picked} onValueChange={setPicked} maxSize={2e9} />
            </Dialog>
          }
          classNames={{ body: "-mx-6 -mb-6" }}
        >
          {rows.length === 0 ? (
            <EmptyState variant="plain" icon={<Folder />} title={t("emptyTitle")} description={t("emptyDescription")} className="pb-10" />
          ) : (
            <Table>
              <TableCaption className="sr-only">{t("contents", { folder: nameOf(current) })}</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">{t("name")}</TableHead>
                  <TableHead className="text-end">{t("size")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("modified")}</TableHead>
                  <TableHead className="hidden pe-6 lg:table-cell">{t("owner")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((entry) => {
                  const Icon = entry.type === "folder" ? Folder : kinds[entry.kind].icon
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="ps-6">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          {entry.type === "folder" ? (
                            <Link href={hrefOf(entry.id)} scroll={false} className="truncate font-medium hover:underline">
                              {nameOf(entry)}
                            </Link>
                          ) : (
                            <span className="truncate">{entry.name}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground tabular-nums">{bytes(sizeOf(entry))}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{format.date(entry.modified)}</TableCell>
                      <TableCell className="hidden pe-6 text-muted-foreground lg:table-cell">{entry.owner}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </section>
    </>
  )
}
