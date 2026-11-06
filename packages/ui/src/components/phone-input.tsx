"use client"

import * as React from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { useLocale } from "../lib/locale"
import { cn } from "../lib/utils"
import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandRoot } from "./command"
import { type FieldClassNames, type FieldOwnProps } from "./field"
import { Input } from "./input"
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover"

// Each region's calling code (ITU-T E.164), as ISO 3166 code + digits. The North American Numbering Plan shares +1,
// and Russia and Kazakhstan +7; the country picked tells them apart.
const callingCodes = Object.fromEntries(
  (
    "AF93 AX358 AL355 DZ213 AS1 AD376 AO244 AI1 AG1 AR54 AM374 AW297 AU61 AT43 AZ994 BS1 BH973 BD880 BB1 BY375 BE32 BZ501 " +
    "BJ229 BM1 BT975 BO591 BA387 BW267 BR55 IO246 VG1 BN673 BG359 BF226 BI257 KH855 CM237 CA1 CV238 BQ599 KY1 CF236 TD235 " +
    "CL56 CN86 CX61 CC61 CO57 KM269 CG242 CD243 CK682 CR506 CI225 HR385 CU53 CW599 CY357 CZ420 DK45 DJ253 DM1 DO1 EC593 " +
    "EG20 SV503 GQ240 ER291 EE372 SZ268 ET251 FK500 FO298 FJ679 FI358 FR33 GF594 PF689 GA241 GM220 GE995 DE49 GH233 GI350 " +
    "GR30 GL299 GD1 GP590 GU1 GT502 GG44 GN224 GW245 GY592 HT509 HN504 HK852 HU36 IS354 IN91 ID62 IR98 IQ964 IE353 IM44 " +
    "IL972 IT39 JM1 JP81 JE44 JO962 KZ7 KE254 KI686 XK383 KW965 KG996 LA856 LV371 LB961 LS266 LR231 LY218 LI423 LT370 " +
    "LU352 MO853 MG261 MW265 MY60 MV960 ML223 MT356 MH692 MQ596 MR222 MU230 YT262 MX52 FM691 MD373 MC377 MN976 ME382 MS1 " +
    "MA212 MZ258 MM95 NA264 NR674 NP977 NL31 NC687 NZ64 NI505 NE227 NG234 NU683 NF672 KP850 MK389 MP1 NO47 OM968 PK92 " +
    "PW680 PS970 PA507 PG675 PY595 PE51 PH63 PL48 PT351 PR1 QA974 RE262 RO40 RU7 RW250 BL590 SH290 KN1 LC1 MF590 PM508 " +
    "VC1 WS685 SM378 ST239 SA966 SN221 RS381 SC248 SL232 SG65 SX1 SK421 SI386 SB677 SO252 ZA27 KR82 SS211 ES34 LK94 SD249 " +
    "SR597 SJ47 SE46 CH41 SY963 TW886 TJ992 TZ255 TH66 TL670 TG228 TK690 TO676 TT1 TN216 TR90 TM993 TC1 TV688 UG256 UA380 " +
    "AE971 GB44 US1 UY598 UZ998 VU678 VA39 VE58 VN84 VI1 WF681 EH212 YE967 ZM260 ZW263"
  )
    .split(" ")
    .map((entry) => [entry.slice(0, 2), entry.slice(2)] as const)
) as Record<string, string>

const allCountries = Object.keys(callingCodes)

/** Where a leading 0 is part of the number, not a trunk prefix dropped after the country code. */
const keepsLeadingZero = new Set(["IT", "SM", "VA"])

/** The flag emoji, from the two regional indicator letters (Windows shows the letters instead). */
const flag = (country: string) => String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))

/** The country a full number starts with: the longest calling code that fits, the one already picked winning a tie (+1). */
function detectCountry(digits: string, current: string, countries: string[]) {
  const currentCode = callingCodes[current]
  if (currentCode && digits.startsWith(currentCode)) return current
  let best: string | undefined
  for (const country of countries) {
    const code = callingCodes[country]!
    if (digits.startsWith(code) && (!best || code.length > callingCodes[best]!.length)) best = country
  }
  return best
}

/** "+6281234567890" for the country and what was typed: digits only, the trunk 0 dropped; "" when nothing's typed. */
function toE164(country: string, national: string) {
  const digits = national.replace(/\D/g, "")
  if (!digits) return ""
  return `+${callingCodes[country]}${keepsLeadingZero.has(country) ? digits : digits.replace(/^0/, "")}`
}

type PhoneInputDetails = {
  /** The country picked, ISO 3166: "ID". */
  country: string
  /** The digits typed, without the country code: "081234567890". */
  national: string
}

type PhoneInputProps = FieldOwnProps & {
  /** The number in international form (E.164), controlled: "+6281234567890". "" for none. */
  value?: string
  defaultValue?: string
  /** Called with the international number ("" when empty), and the country and digits typed. */
  onValueChange?: (value: string, details: PhoneInputDetails) => void
  /** The country picked, controlled (ISO 3166: "ID"). */
  country?: string
  /** The country picked first. Without one, it follows the number given, or the United States. */
  defaultCountry?: string
  onCountryChange?: (country: string) => void
  /** Only these countries in the list. */
  countries?: string[]
  /** Listed first, above the rest: the countries most of your users are in. */
  preferredCountries?: string[]
  /** The form field's name: the number is sent in international form. */
  name?: string
  id?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  "aria-label"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  /** The field's classes. */
  className?: string
  classNames?: FieldClassNames & { trigger?: string; content?: string }
}

/**
 * A phone number with its country, in one tag: `<PhoneInput label="Phone" defaultCountry="ID" onValueChange={setPhone} />`.
 * The flag and calling code open a searchable list of countries, named in the reader's language; the number is
 * grouped as it's typed, and comes out in international form (E.164), ready to store or send. Pasting a number
 * with its country code (+62 …) picks the country.
 */
function PhoneInput({
  value,
  defaultValue = "",
  onValueChange,
  country: countryProp,
  defaultCountry,
  onCountryChange,
  countries: countriesProp,
  preferredCountries,
  name,
  disabled,
  placeholder,
  className,
  classNames,
  ...props
}: PhoneInputProps) {
  const { t, locale } = useLocale()
  const countries = React.useMemo(
    () => (countriesProp ?? allCountries).map((c) => c.toUpperCase()).filter((c) => c in callingCodes),
    [countriesProp]
  )
  const fallback = countries.includes(defaultCountry?.toUpperCase() ?? "") ? defaultCountry!.toUpperCase() : countries.includes("US") ? "US" : countries[0]!

  // What's typed (digits, the way they were typed, a leading 0 kept) and the country, both read from the starting
  // number when there is one.
  const [state, setState] = React.useState(() => {
    const start = (value ?? defaultValue).replace(/\D/g, "")
    const found = start ? detectCountry(start, countryProp?.toUpperCase() ?? fallback, countries) : undefined
    return { country: found ?? fallback, national: found ? start.slice(callingCodes[found]!.length) : "" }
  })
  const country = countryProp?.toUpperCase() ?? state.country
  const e164 = toE164(country, state.national)

  // A number set from outside (the parent's state, a form reset): read it again, unless it's what's shown already.
  // Only when value itself changed, so a number written another way ("+620812…") can't keep it re-reading.
  const [seen, setSeen] = React.useState(value)
  if (value !== seen) setSeen(value)
  if (value !== undefined && value !== seen && value !== e164) {
    const digits = value.replace(/\D/g, "")
    const found = digits ? detectCountry(digits, country, countries) : undefined
    setState({ country: found ?? country, national: found ? digits.slice(callingCodes[found]!.length) : "" })
  }

  const [open, setOpen] = React.useState(false)
  const names = React.useMemo(() => {
    let display: Intl.DisplayNames | undefined
    try {
      display = new Intl.DisplayNames([locale], { type: "region" })
    } catch {
      display = undefined
    }
    return Object.fromEntries(countries.map((c) => [c, display?.of(c) ?? c])) as Record<string, string>
  }, [countries, locale])

  const sorted = React.useMemo(() => [...countries].sort((a, b) => names[a]!.localeCompare(names[b]!, locale)), [countries, names, locale])
  const preferred = (preferredCountries ?? []).map((c) => c.toUpperCase()).filter((c) => countries.includes(c))

  function update(nextCountry: string, nextNational: string) {
    if (nextCountry !== country) onCountryChange?.(nextCountry)
    setState({ country: nextCountry, national: nextNational })
    const next = toE164(nextCountry, nextNational)
    if (next !== e164 || nextCountry !== country) onValueChange?.(next, { country: nextCountry, national: nextNational })
  }

  function pickCountry(next: string) {
    setOpen(false)
    update(next, state.national)
  }

  const item = (c: string) => (
    <CommandItem key={c} value={`${names[c]} ${c} +${callingCodes[c]}`} onSelect={() => pickCountry(c)}>
      <CheckIcon aria-hidden className={cn(c === country ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className="text-base leading-none">
        {flag(c)}
      </span>
      <span className="min-w-0 flex-1 truncate">{names[c]}</span>
      <span dir="ltr" className="text-xs text-muted-foreground tabular-nums">
        +{callingCodes[c]}
      </span>
    </CommandItem>
  )

  const picker = (
    <PopoverRoot open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={disabled}
        aria-label={`${t("country")}: ${names[country]}`}
        className={cn(
          "-ms-1.5 flex h-7 shrink-0 items-center gap-1 rounded-sm px-1.5 text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none data-[state=open]:bg-accent",
          classNames?.trigger
        )}
      >
        <span aria-hidden className="text-base leading-none">
          {flag(country)}
        </span>
        <span dir="ltr" className="text-sm tabular-nums">
          +{callingCodes[country]}
        </span>
        <ChevronDownIcon aria-hidden className="size-3.5! opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className={cn("w-72 p-0", classNames?.content)}>
        <CommandRoot>
          <CommandInput placeholder={t("searchCountries")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            {preferred.length > 0 && <CommandGroup>{preferred.map(item)}</CommandGroup>}
            <CommandGroup>{sorted.filter((c) => !preferred.includes(c)).map(item)}</CommandGroup>
          </CommandList>
        </CommandRoot>
      </PopoverContent>
    </PopoverRoot>
  )

  return (
    <>
      <Input
        {...props}
        type="tel"
        format="phone"
        dir="ltr"
        disabled={disabled}
        placeholder={placeholder}
        prefix={picker}
        value={state.national}
        onValueChange={(raw) => update(country, raw)}
        // A whole number pasted with its country code ("+62 812…", "0062 812…"): pick the country and keep the rest.
        onPaste={(event) => {
          const text = event.clipboardData.getData("text").trim()
          if (!/^(\+|00)/.test(text)) return
          const digits = text.replace(/^00/, "").replace(/\D/g, "")
          const found = detectCountry(digits, country, countries)
          if (!found) return
          event.preventDefault()
          update(found, digits.slice(callingCodes[found]!.length))
        }}
        className={className}
        classNames={classNames}
      />
      {name && <input type="hidden" name={name} value={e164} disabled={disabled} />}
    </>
  )
}

export { PhoneInput, type PhoneInputProps, type PhoneInputDetails }
