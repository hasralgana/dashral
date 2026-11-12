"use client"

// The language and reading direction the components speak: their built-in words ("Search…", "Rows per page"), the
// locale numbers and dates are written in, and right to left (Arabic). Without a LocaleProvider they're English,
// left to right. Messages are plain strings with {placeholders}, or { one, other, … } plural forms, so a server
// layout can pass them.

import * as React from "react"
import { Direction } from "radix-ui"

export type PluralMessage = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
type Message = string | PluralMessage

export const defaultMessages = {
  close: "Close",
  cancel: "Cancel",
  continue: "Continue",
  navigation: "Navigation",
  openNavigation: "Open navigation",
  collapseSidebar: "Collapse sidebar",
  expandSidebar: "Expand sidebar",
  done: "Done",
  dismiss: "Dismiss",
  loading: "Loading",
  remove: "Remove {name}",
  selected: "Selected",
  noResults: "No results found.",
  noMatches: "No matches",
  noData: "No data",
  search: "Search…",
  selectOption: "Select an option",
  selectOptions: "Select options",
  increase: "Increase",
  decrease: "Decrease",
  /** A stepper meeting its limit: "Max 50", "Min 1". */
  atMax: "Max {value}",
  atMin: "Min {value}",
  /** A button that runs only when held (said to screen readers after its label). */
  pressAndHold: "(press and hold)",
  resize: "Resize",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy",
  showPassword: "Show password",
  hidePassword: "Hide password",
  // Dates
  pickDate: "Pick a date",
  pickDateRange: "Pick a date range",
  pickTime: "Pick a time",
  typeTime: "Type a time",
  pickMonth: "Pick a month",
  pickYear: "Pick a year",
  previousYear: "Previous year",
  nextYear: "Next year",
  previousYears: "Earlier years",
  nextYears: "Later years",
  chooseYear: "Choose a year",
  shortcuts: "Shortcuts",
  today: "Today",
  yesterday: "Yesterday",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  // Tags and files
  addTag: "Add a tag…",
  tags: "Tags",
  tagLimit: { one: "Up to {count} tag.", other: "Up to {count} tags." } as Message,
  chosenFiles: "Chosen files",
  dropFiles: "Drop files here or {browse}",
  dropFile: "Drop a file here or {browse}",
  browse: "browse",
  fileType: "{name}: this type of file isn't accepted.",
  fileSize: "{name} is larger than {size}.",
  fileLimit: { one: "{name}: up to {count} file.", other: "{name}: up to {count} files." } as Message,
  upToSize: "up to {size}",
  filesMax: { one: "{count} file max", other: "{count} files max" } as Message,
  images: "Images",
  videos: "Videos",
  audio: "Audio",
  textFiles: "Text files",
  // Cropping pictures
  cropArea: "Crop area",
  imageFailed: "Couldn't open this picture. Try another one.",
  cropFailed: "Couldn't crop this picture. Try again, or pick another one.",
  cropInstructions: "Drag the picture, or use the arrow keys, to move it. Press + or − to zoom.",
  zoom: "Zoom",
  zoomInImage: "Zoom in",
  zoomOutImage: "Zoom out",
  rotateImage: "Rotate 90°",
  cropPhoto: "Crop your photo",
  cropPhotoHint: "Move and zoom the photo until it sits right in the circle.",
  cropImage: "Crop the image",
  cropImageHint: "Move and zoom the image until it sits right in the square.",
  apply: "Apply",
  uploadPhoto: "Upload photo",
  changePhoto: "Change photo",
  removePhoto: "Remove photo",
  uploadImage: "Upload image",
  changeImage: "Change image",
  removeImage: "Remove image",
  // Pages
  pagination: "Pagination",
  previous: "Previous",
  next: "Next",
  previousPage: "Go to previous page",
  nextPage: "Go to next page",
  firstPage: "First page",
  lastPage: "Last page",
  page: "Page {page}",
  pageOf: "Page {page} of {total}",
  morePages: "More pages",
  // Carousel
  carousel: "Carousel",
  slideOf: "{index} of {total}",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  goToSlide: "Go to slide {index}",
  pauseSlides: "Pause",
  playSlides: "Play",
  // Data table
  searchTable: "Search...",
  noRows: "No results.",
  tryAnother: "Try another search or clear the filters.",
  clearFilters: "Clear filters",
  clearFilter: "Clear filter",
  filters: "Filters",
  loadingMore: "Loading more…",
  loadMoreFailed: "Couldn't load more.",
  /** A virtual Data Table's footer: some of the rows (searched, filtered or still loading) out of all of them. */
  showingRowsOf: { one: "Showing {shown} of {count} row", other: "Showing {shown} of {count} rows" } as Message,
  rowsMore: { one: "{count} row · more as you scroll", other: "{count} rows · more as you scroll" } as Message,
  reset: "Reset",
  export: "Export",
  exportAll: "Export all matching rows",
  exportSelected: "Export {count} selected",
  columns: "Columns",
  toggleColumns: "Toggle columns",
  rowsPerPage: "Rows per page",
  rows: { one: "{count} row", other: "{count} rows" } as Message,
  rowsSelected: "{selected} of {total} selected",
  selectAllRows: "Select all rows on this page",
  selectRow: "Select row",
  // Command palette
  commandTitle: "Command palette",
  commandDescription: "Search for a command to run",
  commandPlaceholder: "Type a command or search…",
  // Charts
  less: "Less",
  more: "More",
  trend: "Trend from {from} to {to}",
  heatmapSummary: "{count} over {weeks} weeks to {date}",
  heatmapBusiest: "; the busiest day was {date} with {value}.",
  donutChart: "Donut chart",
  treemap: "Treemap",
  treemapLevels: "Treemap levels",
  all: "All",
  zoomIn: "{name}. Zoom in",
  candlestickChart: "Candlestick chart",
  areaChart: "Area chart",
  lineChart: "Line chart",
  barChart: "Bar chart",
  comboChart: "Combo chart",
  /** What a Tracker is, said after its name. */
  tracker: "tracker",
  funnelChart: "Funnel chart",
  /** Read out at a funnel step after the first. */
  funnelFrom: "{rate} of {from} carried on; {lost} dropped",
  // Sortable
  /** What a draggable item is, said after its name. */
  sortableItem: "sortable item",
  /** A sortable item's grip. */
  sortableReorder: "Reorder {name}",
  sortableInstructions: "To reorder, press Space or Enter to pick up. Use the arrow keys to move it, Space or Enter to drop it, Escape to cancel.",
  sortablePicked: "Picked up {name}, position {position} of {count}.",
  sortableOver: "{name} moved to position {position} of {count}.",
  sortableDropped: "{name} dropped at position {position} of {count}.",
  sortableCancelled: "Reordering cancelled. {name} is back at position {position}.",
  candle: "{date}: open {open}, high {high}, low {low}, close {close}",
  candleOpen: "O",
  candleHigh: "H",
  candleLow: "L",
  candleClose: "C",
  volume: "Vol",
  // AI
  message: "Message",
  askAnything: "Ask anything…",
  sendMessage: "Send message",
  stopGenerating: "Stop generating",
  attachFiles: "Attach files",
  attachments: "Attachments",
  dropToAttach: "Drop files to attach them",
  charactersLeft: { one: "{count} character left", other: "{count} characters left" } as Message,
  charactersOver: { one: "{count} character over the limit", other: "{count} characters over the limit" } as Message,
  you: "You",
  assistant: "Assistant",
  regenerate: "Regenerate",
  goodResponse: "Good response",
  badResponse: "Bad response",
  messageFailed: "Couldn't finish this answer.",
  tryAgain: "Try again",
  conversation: "Conversation",
  jumpToLatest: "Jump to latest",
  thinking: "Thinking…",
  thoughtFor: { one: "Thought for {count} second", other: "Thought for {count} seconds" } as Message,
  thoughtBriefly: "Thought for a moment",
  toolActivity: "Tool activity",
  toolPending: "Waiting",
  toolRunning: "Running",
  toolDone: "Done",
  toolFailed: "Failed",
  toolInput: "Input",
  toolOutput: "Output",
  toolStatus: "{name}: {status}",
  needsApproval: "Needs your approval",
  approve: "Approve",
  allowOnce: "Allow once",
  allowAlways: "Always allow",
  deny: "Deny",
  approved: "Approved",
  denied: "Denied",
  alwaysAllowed: "Always allowed",
  suggestions: "Suggestions",
  // Rating
  rating: "Rating",
  ratingStars: { one: "{count} star", other: "{count} stars" } as Message,
  ratingOf: "{value} out of {max}",
  // Colors
  pickColor: "Pick a color",
  colorArea: "Saturation and brightness",
  colorAreaValue: "Saturation {saturation}%, brightness {brightness}%",
  hue: "Hue",
  swatches: "Swatches",
  pickFromScreen: "Pick a color from the screen",
  // Phone numbers
  country: "Country",
  searchCountries: "Search countries…",
  // Lightbox
  imageViewer: "Image viewer",
  viewImage: "View {name}",
  imageOf: "{index} of {total}",
  previousImage: "Previous image",
  nextImage: "Next image",
  // Selection and forms
  selectAll: "Select all",
  selectedCount: { one: "{count} selected", other: "{count} selected" } as Message,
  selectionActions: "Actions for the selection",
  clearSelection: "Clear selection",
  time: "Time",
  // Passwords
  passwordStrength: "Password strength",
  passwordWeak: "Weak",
  passwordFair: "Fair",
  passwordGood: "Good",
  passwordStrong: "Strong",
  ruleLength: { one: "At least {count} character", other: "At least {count} characters" } as Message,
  ruleCase: "Upper and lower case letters",
  ruleNumber: "A number",
  ruleSymbol: "A symbol",
  ruleMet: "(met)",
  ruleNotMet: "(not met yet)",
  // Editing in place
  edit: "Edit",
  cantBeEmpty: "This can't be empty.",
  saveFailed: "Couldn't save. Try again.",
  // Time zones
  pickTimeZone: "Select a time zone",
  searchTimeZones: "Search time zones…",
  // JSON
  jsonKeys: { one: "{count} key", other: "{count} keys" } as Message,
  jsonItems: { one: "{count} item", other: "{count} items" } as Message,
  showMore: "Show {count} more",
}

export type LocaleMessages = typeof defaultMessages
export type MessageKey = keyof LocaleMessages

type LocaleContextValue = {
  /** BCP 47, e.g. "en-US", "id-ID", "ar". Numbers and dates are written in it. */
  locale: string
  dir: "ltr" | "rtl"
  messages: LocaleMessages
  /** For Calendar and the date pickers: a react-day-picker locale (month and day names, first day of the week). */
  dateLocale?: unknown
}

const LocaleContext = React.createContext<LocaleContextValue>({ locale: "en-US", dir: "ltr", messages: defaultMessages })

/**
 * Sets the language and direction for the components inside, and Radix's direction (menus, sliders and tabs follow
 * it with the keyboard). Pass only the messages you translate; the rest stay English.
 */
export function LocaleProvider({
  locale,
  dir = "ltr",
  messages,
  dateLocale,
  children,
}: {
  locale: string
  dir?: "ltr" | "rtl"
  messages?: Partial<LocaleMessages>
  dateLocale?: unknown
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ locale, dir, messages: { ...defaultMessages, ...messages }, dateLocale }),
    [locale, dir, messages, dateLocale]
  )
  return React.createElement(LocaleContext.Provider, { value }, React.createElement(Direction.Provider, { dir }, children))
}

/** Fills {placeholders} (numbers written in the locale); a plural message picks its form by `count` with the locale's rules (Arabic has six). */
export function formatMessage(message: Message, values: Record<string, React.ReactNode> = {}, locale = "en-US"): string {
  const template =
    typeof message === "string"
      ? message
      : (message[new Intl.PluralRules(locale).select(Number(values.count ?? 0))] ?? message.other)
  // Numbers are written in the locale (1,175 · 1.175 · ١٬١٧٥ by its own rules).
  const number = new Intl.NumberFormat(locale)
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) return match
    const value = values[key]
    return typeof value === "number" ? number.format(value) : String(value)
  })
}

/** The locale, direction and a translator for the components' words: t("pageOf", { page: 2, total: 7 }). */
export function useLocale() {
  const context = React.useContext(LocaleContext)
  const t = React.useCallback(
    (key: MessageKey, values?: Record<string, React.ReactNode>) => formatMessage(context.messages[key], values, context.locale),
    [context]
  )
  return { ...context, t }
}
