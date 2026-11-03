import { ImageResponse } from "next/og"

import { logoMarkUrl } from "@/lib/logo-mark"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

// iOS fills a transparent touch icon with black, so the logo sits on white here; iOS rounds the corners itself.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
        <img src={logoMarkUrl} width={120} height={120} alt="" />
      </div>
    ),
    size
  )
}
