"use client"

import { useEffect, useState } from "react"
import { Check, Globe, MapPin, TriangleAlert } from "lucide-react"
import { AvatarUpload } from "@dashral/ui/components/avatar-upload"
import { Button } from "@dashral/ui/components/button"
import { Input } from "@dashral/ui/components/input"
import { Textarea } from "@dashral/ui/components/textarea"
import { enterMotion, stagger } from "@dashral/ui/lib/motion"
import { cn } from "@dashral/ui/lib/utils"

/** A profile: the photo is a URL you have, the File just cropped, or null for none. */
export type Profile = {
  photo: File | string | null
  name: string
  username: string
  bio: string
  website: string
  location: string
}

const sampleProfile: Profile = {
  photo: "https://randomuser.me/api/portraits/women/44.jpg",
  name: "Olivia Martin",
  username: "olivia",
  bio: "Product designer at Acme. I draw dashboards people enjoy opening on a Monday.",
  website: "https://olivia.design",
  location: "Jakarta, Indonesia",
}

/** "olivia.design/work" from "https://www.olivia.design/work/", for showing; the link keeps the address as given. */
const shortUrl = (url: string) =>
  url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")

/** A link people can open: "olivia.design" gets https:// in front. */
const fullUrl = (url: string) => (/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`)

const validUrl = (url: string) => {
  if (!url.trim()) return true
  try {
    const { hostname } = new URL(fullUrl(url))
    return hostname.includes(".") && !hostname.endsWith(".")
  } catch {
    return false
  }
}

/**
 * Pictures that cross-fade: a new one fades in over the old, which stays until it has; a removed one fades out over
 * what's under it. So a change never blinks empty.
 */
function Crossfade({ src, className }: { src: string | null; className?: string }) {
  const [layers, setLayers] = useState<{ src: string; leaving: boolean }[]>(src ? [{ src, leaving: false }] : [])
  const [shown, setShown] = useState(src)
  if (shown !== src) {
    setShown(src)
    setLayers((all) => [...all.filter((layer) => layer.src !== src).map((layer) => ({ ...layer, leaving: true })), ...(src ? [{ src, leaving: false }] : [])])
  }
  const top = layers.at(-1)
  return layers.map((layer) => (
    <Layer
      key={layer.src}
      src={layer.src}
      leaving={layer.leaving && layer === top}
      className={className}
      // Faded out: gone. Faded in (or failed to load): the pictures under it can go.
      onDone={() => setLayers((all) => all.filter((item) => (layer.leaving ? item !== layer : !item.leaving)))}
    />
  ))
}

function Layer({ src, leaving, className, onDone }: { src: string; leaving: boolean; className?: string; onDone: () => void }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={onDone}
      onAnimationEnd={onDone}
      className={cn(
        "absolute inset-0 size-full object-cover",
        !loaded && "opacity-0",
        loaded && !leaving && "animate-in fade-in-0 duration-(--duration-standard) ease-enter",
        leaving && "animate-out fade-out-0 fill-mode-forwards duration-(--duration-standard) ease-exit",
        className
      )}
    />
  )
}

/** Whether two values hold the same fields (a File by identity), so a new object with the same content isn't a change. */
const sameFields = <T extends object>(a: T, b: T) => (Object.keys(a) as (keyof T)[]).every((key) => a[key] === b[key]) && Object.keys(a).length === Object.keys(b).length

/** A File's object URL while it's shown, or the URL itself. */
function usePhotoUrl(photo: File | string | null) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const isFile = typeof File !== "undefined" && photo instanceof File
  useEffect(() => {
    if (!isFile) return setFileUrl(null)
    const next = URL.createObjectURL(photo)
    setFileUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [photo, isFile])
  return isFile ? fileUrl : (photo as string | null) || null
}

/**
 * How the profile looks to others: the photo, name and handle, the bio, the website and the place. ProfileSettings
 * shows it beside the form, changing as you type; use it on its own for a profile page or a hover card.
 */
export function ProfileCard({ profile, handlePrefix = "@", className }: { profile: Profile; handlePrefix?: string; className?: string }) {
  const photo = usePhotoUrl(profile.photo)
  const name = profile.name.trim() || "Your name"
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      {/* A quiet band behind the photo, in the theme's own colours. */}
      <div aria-hidden className="h-16 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
      <div className="-mt-8 px-5 pb-5">
        {/* The initials under the photo, so a new photo cross-fades over the old and a removed one leaves them. */}
        <span aria-hidden className="relative grid size-16 place-items-center overflow-hidden rounded-full bg-muted text-lg font-medium text-muted-foreground ring-4 ring-card">
          {initials(name)}
          <Crossfade src={photo} />
        </span>
        <p className="mt-3 truncate font-semibold">{name}</p>
        {profile.username.trim() && (
          <p className="truncate text-sm text-muted-foreground">
            {handlePrefix}
            {profile.username.trim()}
          </p>
        )}
        {profile.bio.trim() && <p className="mt-3 text-sm break-words whitespace-pre-line">{profile.bio.trim()}</p>}
        {(profile.website.trim() || profile.location.trim()) && (
          <ul className="mt-4 grid gap-1.5 text-sm text-muted-foreground">
            {profile.location.trim() && (
              <li className="flex min-w-0 items-center gap-2">
                <MapPin aria-hidden className="size-4 shrink-0" />
                <span className="truncate">{profile.location.trim()}</span>
              </li>
            )}
            {profile.website.trim() && (
              <li className="flex min-w-0 items-center gap-2">
                <Globe aria-hidden className="size-4 shrink-0" />
                {validUrl(profile.website) ? (
                  <a href={fullUrl(profile.website)} target="_blank" rel="noopener noreferrer" className="truncate text-foreground underline-offset-4 hover:underline">
                    {shortUrl(profile.website)}
                  </a>
                ) : (
                  <span className="truncate">{shortUrl(profile.website)}</span>
                )}
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * A profile settings page: the photo (picked or dropped, cropped to a square), name, username, bio, website and place,
 * beside a card showing how the profile looks to others as you type. Save sends everything to onSave: the photo is a
 * File when it's new, null when it was removed, and the URL you gave when it's unchanged. A handler that throws keeps
 * the changes and says why.
 */
export function ProfileSettings({
  defaultValue = sampleProfile,
  onSave,
  title = "Profile",
  description = "How you appear to your team and on your public page.",
  handlePrefix = "@",
  usernamePrefix = "acme.com/",
  bioLimit = 160,
}: {
  /** The profile as it's saved now. */
  defaultValue?: Profile
  /** Saves the profile; throw an Error to keep the changes and show its message. */
  onSave?: (profile: Profile) => Promise<void> | void
  title?: string
  description?: string
  /** Before the username on the card: "@" by default. */
  handlePrefix?: string
  /** Inside the username field, before it: the address of the public page. "" for none. */
  usernamePrefix?: string
  /** Longest bio, in characters. */
  bioLimit?: number
}) {
  const [saved, setSaved] = useState(defaultValue)
  const [profile, setProfile] = useState(defaultValue)
  const [touched, setTouched] = useState<Partial<Record<keyof Profile, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  // A new defaultValue (say, loaded from your server) starts the form again from it.
  // Compared by content, so an object written inline (new on every render) doesn't wipe what's being edited.
  const [given, setGiven] = useState(defaultValue)
  if (!sameFields(given, defaultValue)) {
    setGiven(defaultValue)
    setSaved(defaultValue)
    setProfile(defaultValue)
    setTouched({})
  }

  // "Saved" shows on the button for a moment.
  useEffect(() => {
    if (!done) return
    const timer = setTimeout(() => setDone(false), 2000)
    return () => clearTimeout(timer)
  }, [done])

  const errors: Partial<Record<keyof Profile, string>> = {}
  if (!profile.name.trim()) errors.name = "Write your name."
  const username = profile.username.trim()
  if (!username) errors.username = "Pick a username."
  else if (!/^[a-z0-9_-]{3,30}$/.test(username)) errors.username = "3 to 30 lowercase letters, numbers, - or _."
  if (profile.bio.length > bioLimit) errors.bio = `Up to ${bioLimit} characters.`
  if (!validUrl(profile.website)) errors.website = "That doesn't look like a web address."
  const invalid = Object.keys(errors).length > 0

  const dirty = !sameFields(profile, saved)

  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((current) => ({ ...current, [key]: value }))
    setDone(false)
  }
  const blur = (key: keyof Profile) => () => setTouched((current) => ({ ...current, [key]: true }))
  // An error shows once you've left the field, or tried to save.
  const shown = (key: keyof Profile) => (touched[key] ? errors[key] : undefined)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setTouched({ name: true, username: true, bio: true, website: true, location: true })
    if (invalid || !dirty) return
    setSaving(true)
    setProblem(null)
    const next = { ...profile, name: profile.name.trim(), username, bio: profile.bio.trim(), website: profile.website.trim(), location: profile.location.trim() }
    try {
      await onSave?.(next)
      setSaved(next)
      setProfile(next)
      setDone(true)
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Your profile didn't save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setProfile(saved)
    setTouched({})
    setProblem(null)
  }

  return (
    <div className="min-h-full bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.01em]">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          {problem && (
            <p role="alert" className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive-text">
              <TriangleAlert aria-hidden className="size-4 shrink-0" /> {problem}
            </p>
          )}
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <form onSubmit={save} noValidate className={cn(enterMotion, "rounded-xl border bg-card")} style={stagger(0, 60)}>
            {/* Held still while it saves, so nothing typed meanwhile is overwritten when it's done. */}
            <fieldset disabled={saving} className="grid min-w-0 gap-5 p-5">
              <AvatarUpload
                label="Photo"
                value={profile.photo}
                onValueChange={(file) => change("photo", file)}
                fallback={initials(profile.name)}
                maxSize={10 * 1024 * 1024}
                description="JPG, PNG or WebP, up to 10 MB. You crop it to a square."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={profile.name}
                  onChange={(event) => change("name", event.target.value)}
                  onBlur={blur("name")}
                  error={shown("name")}
                  autoComplete="name"
                  maxLength={80}
                  required
                />
                <Input
                  label="Username"
                  value={profile.username}
                  // Usernames are lowercase; spaces become dashes as you type.
                  onChange={(event) => change("username", event.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  onBlur={blur("username")}
                  error={shown("username")}
                  prefix={usernamePrefix || undefined}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={30}
                  required
                />
              </div>
              <Textarea
                label="Bio"
                value={profile.bio}
                onChange={(event) => change("bio", event.target.value)}
                onBlur={blur("bio")}
                error={shown("bio")}
                placeholder="A line or two about you"
                rows={3}
                labelAction={
                  <span className={cn("tabular-nums", profile.bio.length > bioLimit && "text-destructive-text")}>
                    {profile.bio.length}/{bioLimit}
                  </span>
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Website"
                  type="url"
                  inputMode="url"
                  value={profile.website}
                  onChange={(event) => change("website", event.target.value)}
                  onBlur={blur("website")}
                  error={shown("website")}
                  placeholder="yoursite.com"
                  autoComplete="url"
                  autoCapitalize="none"
                  spellCheck={false}
                />
                <Input
                  label="Location"
                  value={profile.location}
                  onChange={(event) => change("location", event.target.value)}
                  placeholder="City, country"
                  autoComplete="address-level2"
                  maxLength={60}
                />
              </div>
            </fieldset>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
              {dirty && !saving && (
                <Button type="button" variant="ghost" size="sm" onClick={discard}>
                  Discard
                </Button>
              )}
              <Button type="submit" size="sm" loading={saving} disabled={!dirty && !done}>
                {done ? (
                  <>
                    <Check aria-hidden /> Saved
                  </>
                ) : (
                  "Save profile"
                )}
              </Button>
            </div>
          </form>

          <aside aria-label="Preview" className={cn(enterMotion, "space-y-2 md:sticky md:top-6")} style={stagger(1, 60)}>
            <p className="text-xs font-medium text-muted-foreground">How others see you</p>
            <ProfileCard profile={profile} handlePrefix={handlePrefix} />
          </aside>
        </div>
      </div>
    </div>
  )
}

/** "Olivia Martin" → "OM". */
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
