// Export rows as CSV or Excel (.xlsx), in the browser and with no library: a CSV writer, a small .xlsx writer (the
// spreadsheet's XML files in an uncompressed zip) and a download helper. Used by DataTable's export menu.

export type ExportCell = string | number | boolean | Date | null | undefined
export type ExportFormat = "csv" | "xlsx"

/**
 * A spreadsheet opens a CSV cell starting with = + - @ (or a tab or return) as a formula, which can run commands on
 * the reader's computer ("CSV injection"). Such text is kept as text with a leading apostrophe. Numbers are safe.
 */
function safeText(text: string) {
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
}

const pad = (n: number) => String(n).padStart(2, "0")
/** "2026-10-15", or "2026-10-15 14:30" when there's a time of day (in the reader's zone). */
function formatDate(date: Date) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return date.getHours() || date.getMinutes() ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day
}

/** Rows (the first one the header) as CSV text: comma-separated, quoted where needed, CRLF line ends. */
export function toCsv(rows: ExportCell[][]): string {
  const cell = (value: ExportCell) => {
    if (value === null || value === undefined) return ""
    const text = value instanceof Date ? formatDate(value) : typeof value === "string" ? safeText(value) : String(value)
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }
  return rows.map((row) => row.map(cell).join(",")).join("\r\n")
}

// ---------- .xlsx ----------

const escapeXml = (text: string) =>
  text.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")

/** "A", "B", … "Z", "AA" for a 0-based column index. */
function columnName(index: number) {
  let name = ""
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name
  return name
}

/** Excel's date number: days since 1899-12-30, in the reader's local time. */
const excelDate = (date: Date) => (date.getTime() - date.getTimezoneOffset() * 60_000) / 86_400_000 + 25569

function sheetXml(rows: ExportCell[][]) {
  // Column widths from the longest text in each column (in characters), within reason.
  const widths: number[] = []
  rows.forEach((row) =>
    row.forEach((value, c) => {
      const length = value instanceof Date ? 16 : value === null || value === undefined ? 0 : String(value).length
      widths[c] = Math.max(widths[c] ?? 8, Math.min(60, length + 2))
    })
  )
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) => {
          const ref = `${columnName(c)}${r + 1}`
          // Style 1 is the bold header.
          const header = r === 0 ? ' s="1"' : ""
          if (value === null || value === undefined || value === "") return ""
          if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${header}><v>${value}</v></c>`
          if (typeof value === "boolean") return `<c r="${ref}" t="b"${header}><v>${value ? 1 : 0}</v></c>`
          // Style 2 is a date with its time, 3 a date alone.
          if (value instanceof Date) {
            const style = value.getHours() || value.getMinutes() ? 2 : 3
            return `<c r="${ref}" s="${style}"><v>${excelDate(value)}</v></c>`
          }
          // Text goes in as an inline string: Excel never reads it as a formula.
          return `<c r="${ref}" t="inlineStr"${header}><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`
        })
        .join("")
      return `<row r="${r + 1}">${cells}</row>`
    })
    .join("")
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    // The header row stays in view while scrolling.
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` +
    `<sheetData>${body}</sheetData></worksheet>`
  )
}

const stylesXml =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd hh:mm"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd"/></numFmts>` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`

function workbookFiles(rows: ExportCell[][], sheetName: string): [string, string][] {
  // Sheet names: at most 31 characters, none of : \ / ? * [ ].
  const name = escapeXml(sheetName.replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || "Sheet1")
  return [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${name}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    ["xl/worksheets/sheet1.xml", sheetXml(rows)],
    ["xl/styles.xml", stylesXml],
  ]
}

let crcTable: Uint32Array | undefined
function crc32(bytes: Uint8Array) {
  crcTable ??= Uint32Array.from({ length: 256 }, (_, n) => {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    return c >>> 0
  })
  let crc = 0xffffffff
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

/** Files in a zip archive, stored without compression (Excel reads that fine; the files are small). */
function zip(files: [string, string][]) {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const [name, text] of files) {
    const nameBytes = encoder.encode(name)
    const data = encoder.encode(text)
    const crc = crc32(data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true) // local file header
    local.setUint16(4, 20, true) // version needed
    local.setUint16(6, 0x0800, true) // UTF-8 names
    local.setUint32(14, crc, true)
    local.setUint32(18, data.length, true) // compressed size (stored)
    local.setUint32(22, data.length, true)
    local.setUint16(26, nameBytes.length, true)
    parts.push(new Uint8Array(local.buffer), nameBytes, data)

    const entry = new DataView(new ArrayBuffer(46))
    entry.setUint32(0, 0x02014b50, true) // central directory entry
    entry.setUint16(4, 20, true)
    entry.setUint16(6, 20, true)
    entry.setUint16(8, 0x0800, true)
    entry.setUint32(16, crc, true)
    entry.setUint32(20, data.length, true)
    entry.setUint32(24, data.length, true)
    entry.setUint16(28, nameBytes.length, true)
    entry.setUint32(42, offset, true)
    central.push(new Uint8Array(entry.buffer), nameBytes)
    offset += 30 + nameBytes.length + data.length
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true) // end of central directory
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)
  const all = [...parts, ...central, new Uint8Array(end.buffer)]
  const out = new Uint8Array(new ArrayBuffer(all.reduce((sum, part) => sum + part.length, 0)))
  let at = 0
  for (const part of all) {
    out.set(part, at)
    at += part.length
  }
  return out
}

/** Rows (the first one the header) as an .xlsx workbook with one sheet. */
export function toXlsx(rows: ExportCell[][], sheetName = "Sheet1"): Uint8Array<ArrayBuffer> {
  return zip(workbookFiles(rows, sheetName))
}

/** Saves a file in the browser. */
export function downloadFile(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = Object.assign(document.createElement("a"), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Downloads rows (the first one the header) as `filename.csv` or `filename.xlsx`. The CSV starts with a byte order
 * mark, so Excel reads accents and other scripts (Arabic, CJK) correctly.
 */
export function exportRows(format: ExportFormat, rows: ExportCell[][], filename: string) {
  const base = filename.replace(/\.(csv|xlsx)$/i, "")
  if (format === "csv") downloadFile(`﻿${toCsv(rows)}`, `${base}.csv`, "text/csv;charset=utf-8")
  else downloadFile(toXlsx(rows, base), `${base}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
}
