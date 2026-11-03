import { readFileSync } from "node:fs"
import { join } from "node:path"

/** The logo as an SVG file, for images drawn on the server (the Apple touch icon, social cards): app/icon.svg itself. */
export const logoMark = readFileSync(join(process.cwd(), "app/icon.svg"), "utf8")

const dataUrl = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`

/** The logo as a data URL, for an <img> in an ImageResponse on a light background. */
export const logoMarkUrl = dataUrl(logoMark)

/**
 * The same for a dark background: the default logo's ink (#0a0a0a) turned white. A logo of your own in other colors
 * stays as it is.
 */
export const logoMarkOnDarkUrl = dataUrl(logoMark.replaceAll("#0a0a0a", "#fafafa"))
