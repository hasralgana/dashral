import { getTranslations } from "next-intl/server"
import { Spinner } from "@dashral/ui/components/spinner"

/**
 * What a dashboard page shows while it's on its way (app/(dashboard)/loading.tsx, app/inset/loading.tsx): the menu
 * and header stay, and the page's place holds a spinner in a small tile. It waits a moment before showing, so a page
 * that comes quickly never flashes it.
 */
export async function PageLoader() {
  const t = await getTranslations("kit")
  return (
    <div className="grid min-h-[60svh] place-items-center animate-in fade-in-0 delay-200 duration-(--duration-standard) fill-mode-both">
      <span className="grid size-10 place-items-center rounded-xl border bg-card shadow-xs">
        <Spinner size="sm" label={t("loading")} className="text-muted-foreground" />
      </span>
    </div>
  )
}
