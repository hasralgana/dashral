"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Avatar } from "@dashral/ui/components/avatar"
import { Button } from "@dashral/ui/components/button"

export type Story = { text: string; name: string; role: string; company?: string; src?: string; stat?: { value: string; label: string } }

const sampleQuotes: Story[] = [
  {
    text: "We used to argue about whose spreadsheet was right. Now there's one dashboard, and Monday's meeting takes fifteen minutes instead of an hour.",
    name: "Olivia Martin",
    role: "Head of Operations",
    company: "Acme",
    src: "https://randomuser.me/api/portraits/women/44.jpg",
    stat: { value: "4×", label: "shorter weekly meetings" },
  },
  {
    text: "The alerts caught a broken checkout on a Sunday night. That one message paid for the whole year.",
    name: "Liam Johnson",
    role: "Engineering Manager",
    company: "Globex",
    src: "https://randomuser.me/api/portraits/men/32.jpg",
    stat: { value: "$38K", label: "saved in one weekend" },
  },
  {
    text: "Our finance team finally trusts the numbers. The exports open in Excel exactly the way they expect.",
    name: "Budi Santoso",
    role: "CFO",
    company: "PT Nusantara",
    stat: { value: "12 h", label: "of reporting saved a month" },
  },
]
const sampleLogos: React.ReactNode[] = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Nusantara"]

/**
 * One customer story at a time, large: the quote, who said it and the number it changed, with arrows and dots to
 * read the next. The companies that use the product sit underneath. Every part comes from props.
 */
export function TestimonialFeatured({
  quotes = sampleQuotes,
  logosTitle = "Trusted by teams at",
  logos = sampleLogos,
}: {
  quotes?: Story[]
  logosTitle?: string
  /** The companies under it: names, or logos of their own; none hides the row. */
  logos?: React.ReactNode[]
}) {
  const [index, setIndex] = useState(0)
  const quote = quotes[index]!
  const go = (step: number) => setIndex((index + step + quotes.length) % quotes.length)

  return (
    <section className="bg-background px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <figure aria-roledescription="carousel" aria-label="Customer stories" className="relative rounded-3xl border bg-card p-8 sm:p-12">
          <Quote aria-hidden className="size-8 fill-primary/15 text-primary-text" />
          {/* Keyed by the story, so each one fades in. */}
          <div key={index} aria-live="polite" className="animate-in fade-in-0 slide-in-from-bottom-1 duration-(--duration-standard) ease-enter">
            <blockquote className="mt-6 text-xl leading-relaxed font-medium tracking-tight text-pretty sm:text-2xl">“{quote.text}”</blockquote>
            <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-6">
              <span className="flex items-center gap-3">
                <Avatar src={quote.src} name={quote.name} alt="" size="lg" />
                <span className="grid">
                  <span className="font-semibold">{quote.name}</span>
                  <span className="text-sm text-muted-foreground">{quote.company ? `${quote.role}, ${quote.company}` : quote.role}</span>
                </span>
              </span>
              {quote.stat && (
                <span className="grid text-end">
                  <span className="text-3xl font-semibold tracking-tight text-primary-text">{quote.stat.value}</span>
                  <span className="text-sm text-muted-foreground">{quote.stat.label}</span>
                </span>
              )}
            </figcaption>
          </div>
          {quotes.length > 1 && (
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div className="flex gap-1.5" role="group" aria-label="Choose a story">
                {quotes.map((q, i) => (
                  <button
                    key={q.name}
                    type="button"
                    aria-label={`Story ${i + 1}: ${q.name}`}
                    aria-current={i === index || undefined}
                    onClick={() => setIndex(i)}
                    className={`h-1.5 rounded-full transition-[width,background-color] duration-(--duration-standard) ease-standard outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${i === index ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/50"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" aria-label="Previous story" onClick={() => go(-1)}>
                  <ChevronLeft className="rtl:-scale-x-100" />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Next story" onClick={() => go(1)}>
                  <ChevronRight className="rtl:-scale-x-100" />
                </Button>
              </div>
            </div>
          )}
        </figure>
        {logos.length > 0 && (
          <>
            <p className="mt-12 text-center text-sm text-muted-foreground">{logosTitle}</p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {logos.map((logo, i) => (
                <li key={i} className="text-lg font-semibold tracking-tight text-muted-foreground/70">
                  {logo}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
