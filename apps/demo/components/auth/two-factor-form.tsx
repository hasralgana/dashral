"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@dashral/ui/components/button"
import { Card } from "@dashral/ui/components/card"
import { Checkbox } from "@dashral/ui/components/checkbox"
import { InputOTP } from "@dashral/ui/components/input-otp"
import { toast } from "@dashral/ui/components/toast"

/**
 * The second step of signing in: the 6-digit code from an authenticator app. In the demo any code works; put your
 * auth library's verify call in `verify`.
 */
export function TwoFactorForm() {
  const t = useTranslations("verify")
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string>()
  const [checking, setChecking] = useState(false)
  const [wait, setWait] = useState(30)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  function verify(value: string) {
    // The sixth digit verifies on its own; Enter or the button right after must not verify again.
    if (checking) return
    if (value.length < 6) return setError(t("incomplete"))
    setError(undefined)
    setChecking(true)
    setTimeout(() => {
      toast.success(t("verified"))
      router.push("/")
    }, 700)
  }

  return (
    <Card
      title={t("title")}
      description={t("description")}
      media={
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary-text">
          <ShieldCheck className="size-6" aria-hidden />
        </div>
      }
      classNames={{ header: "text-center", title: "text-xl", body: "space-y-5", media: "pt-6" }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          verify(code)
        }}
        className="space-y-5"
      >
        <InputOTP
          label={t("code")}
          description={t("demo")}
          value={code}
          onValueChange={(value) => {
            setCode(value)
            if (error) setError(undefined)
          }}
          onComplete={verify}
          error={error}
          groups={[3, 3]}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <Checkbox id="trust-device" defaultChecked />
          <label htmlFor="trust-device" className="text-sm">
            {t("trust")}
          </label>
        </div>
        <Button type="submit" className="w-full" loading={checking} loadingText={t("checking")}>
          {t("submit")}
        </Button>
      </form>
      <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <button
          type="button"
          disabled={wait > 0}
          onClick={() => {
            setWait(30)
            toast(t("resent"))
          }}
          className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-70"
        >
          {wait > 0 ? t("resendIn", { seconds: wait }) : t("resend")}
        </button>
        <button type="button" onClick={() => toast(t("recoveryDemo"))} className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
          {t("recovery")}
        </button>
        <Link href="/login" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50">
          {t("back")}
        </Link>
      </div>
    </Card>
  )
}
