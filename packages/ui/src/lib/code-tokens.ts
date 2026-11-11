/**
 * A small highlighter for CodeBlock: it splits code into tokens of five kinds (keywords, strings, tags, numbers and
 * comments), the calm set the kit colors; everything else stays in the text color. It knows TypeScript and JavaScript
 * with JSX, JSON, CSS, HTML and shell, enough for the code a page shows, with no dependency and nothing to load. It
 * is not a parser: for other languages, or exact grammar, pass a highlighter's output to CodeBlock as children.
 */

export type CodeTokenKind = "keyword" | "string" | "tag" | "number" | "comment"
export type CodeToken = { text: string; kind?: CodeTokenKind }

type Family = "script" | "markup" | "json" | "css" | "shell"

const families: Record<string, Family> = {
  js: "script", jsx: "script", ts: "script", tsx: "script", mjs: "script", cjs: "script", javascript: "script", typescript: "script",
  html: "markup", xml: "markup", svg: "markup",
  json: "json", jsonc: "json",
  css: "css",
  bash: "shell", sh: "shell", shell: "shell", zsh: "shell",
}

/** Whether CodeBlock can color this language. */
export function canHighlight(language: string | undefined) {
  return Boolean(language && families[language.toLowerCase()])
}

/**
 * The code as lines of tokens, or null for a language it doesn't know. Joined back, the tokens are the code exactly.
 */
export function tokenizeLines(code: string, language: string | undefined): CodeToken[][] | null {
  const family = language ? families[language.toLowerCase()] : undefined
  if (!family) return null
  const tokens = family === "script" ? scanScript(code, false) : family === "markup" ? scanScript(code, true) : family === "json" ? scanJson(code) : family === "css" ? scanCss(code) : scanShell(code)
  // Every character must come back out; if one was lost, show the code plain rather than wrong.
  if (tokens.map((token) => token.text).join("") !== code) return null
  const lines: CodeToken[][] = [[]]
  for (const token of tokens) {
    token.text.split("\n").forEach((part, index) => {
      if (index) lines.push([])
      if (part) lines[lines.length - 1]!.push({ text: part, kind: token.kind })
    })
  }
  return lines
}

/** Collects tokens, joining neighbours of the same kind. */
function collector() {
  const tokens: CodeToken[] = []
  const add = (text: string, kind?: CodeTokenKind) => {
    if (!text) return
    const last = tokens[tokens.length - 1]
    if (last && last.kind === kind) last.text += text
    else tokens.push({ text, kind })
  }
  return { tokens, add }
}

/** Matches a sticky pattern at `at`, or null. */
function match(pattern: RegExp, code: string, at: number) {
  pattern.lastIndex = at
  return pattern.exec(code)?.[0] ?? null
}

const isWordChar = (char: string | undefined) => Boolean(char && /[\w$]/.test(char))

// ── TypeScript, JavaScript and JSX; and HTML, which is the same tags without the code around them ────────────────

const space = /\s+/y
const lineComment = /\/\/[^\n]*/y
const blockComment = /\/\*[\s\S]*?(?:\*\/|$)/y
const markupComment = /<!--[\s\S]*?(?:-->|$)/y
const doctype = /<![^>]*>?/y
const doubleQuoted = /"(?:\\[\s\S]|[^"\\\n])*"?/y
const singleQuoted = /'(?:\\[\s\S]|[^'\\\n])*'?/y
const tagStart = /<\/?[A-Za-z][\w.:-]*/y
const fragment = /<\/?>/y
const numeric = /(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)n?/y
const word = /[A-Za-z_$][\w$]*/y
const tagFiller = /[^\s"'{>]+/y
const textRun = /[^<{]+/y
const markupTextRun = /[^<]+/y

const keywords = new Set(
  "import export default const let var function return if else for while do switch case break continue new class extends async await try catch finally throw typeof instanceof void delete yield this super static interface enum implements declare readonly public private protected abstract keyof satisfies".split(" ")
)

/** Words that are keywords only where the grammar puts them: `type Props`, `from "x"`, `x as T`, `a of b`, `k in o`. */
function keywordHere(name: string, code: string, start: number, end: number) {
  const before = code[start - 1]
  const after = code.slice(end, end + 64)
  // `type Props = …`, `type Box<T> = …`, `import type { X }`, `import type X from`; never `type="button"` or `type: …`.
  if (name === "type") return before !== "." && /^\s+(?:\{|[A-Za-z_$][\w$]*\s*(?:[=<]|from\b))/.test(after)
  if (name === "from") return /^\s*["'`]/.test(after)
  if (name === "as" || name === "of" || name === "in") return Boolean(before && /\s/.test(before)) && /^\s/.test(after)
  return false
}

type Frame = { mode: "code" | "tag" | "text"; depth: number; closing?: boolean }

function scanScript(code: string, markup: boolean): CodeToken[] {
  const { tokens, add } = collector()
  // Where the scanner is: in code, inside a tag's angle brackets, or in the text between tags. JSX nests them: text
  // holds {code}, code holds <tags>.
  const stack: Frame[] = [{ mode: markup ? "text" : "code", depth: 0 }]
  // The last thing that wasn't whitespace, in code: it decides whether "<" opens a tag or compares two values.
  let last = ""
  let lastWasKeyword = false
  const tagMayStart = () => last === "" || lastWasKeyword || "([{,;:?=&|!>}".includes(last[last.length - 1]!)
  let at = 0

  while (at < code.length) {
    const frame = stack[stack.length - 1]!
    const char = code[at]!
    let found: string | null

    if ((found = match(space, code, at))) {
      add(found)
      at += found.length
      continue
    }

    if (frame.mode === "text") {
      if (markup && (found = match(markupComment, code, at))) add(found, "comment")
      else if (markup && (found = match(doctype, code, at))) add(found)
      else if ((found = match(fragment, code, at))) {
        add(found, "tag")
        if (found === "<>") stack.push({ mode: "text", depth: 0 })
        else if (stack.length > 1) stack.pop()
      } else if ((found = match(tagStart, code, at))) {
        add(found, "tag")
        stack.push({ mode: "tag", depth: 0, closing: found[1] === "/" })
      } else if (char === "{" && !markup) {
        add(char)
        found = char
        stack.push({ mode: "code", depth: 0 })
        last = "{"
        lastWasKeyword = false
      } else if ((found = match(markup ? markupTextRun : textRun, code, at))) add(found)
      else add((found = char))
      at += found.length
      continue
    }

    if (frame.mode === "tag") {
      if (char === '"' || char === "'") add((found = match(char === '"' ? doubleQuoted : singleQuoted, code, at) ?? char), "string")
      else if (char === "{" && !markup) {
        add((found = char))
        stack.push({ mode: "code", depth: 0 })
        last = "{"
        lastWasKeyword = false
      } else if (char === ">") {
        add((found = char))
        const selfClosing = code[at - 1] === "/"
        stack.pop()
        // A closing tag ends its element's text; an opening one begins it.
        if (frame.closing) {
          if (stack.length > 1 && stack[stack.length - 1]!.mode === "text") stack.pop()
        } else if (!selfClosing) stack.push({ mode: "text", depth: 0 })
        last = ">"
        lastWasKeyword = false
      } else add((found = match(tagFiller, code, at) ?? char))
      at += found.length
      continue
    }

    // Code.
    if ((found = match(lineComment, code, at) ?? match(blockComment, code, at))) {
      add(found, "comment")
      at += found.length
      continue
    }
    if (char === "`") {
      at = scanTemplate(code, at, add)
      last = '"'
      lastWasKeyword = false
      continue
    }
    // A quote right after a letter is an apostrophe in a sentence, not the start of a string.
    if ((char === '"' || char === "'") && !isWordChar(code[at - 1])) {
      found = match(char === '"' ? doubleQuoted : singleQuoted, code, at) ?? char
      add(found, "string")
      at += found.length
      last = '"'
      lastWasKeyword = false
      continue
    }
    if (char === "<" && tagMayStart()) {
      if ((found = match(fragment, code, at)) === "<>") {
        add(found, "tag")
        stack.push({ mode: "text", depth: 0 })
        at += found.length
        continue
      }
      // `<T,>` and `<T extends …>` are a generic function's type parameters, not a tag.
      if ((found = match(tagStart, code, at)) && found[1] !== "/" && !/^\s*(?:,|extends\b)/.test(code.slice(at + found.length, at + found.length + 12))) {
        add(found, "tag")
        stack.push({ mode: "tag", depth: 0 })
        at += found.length
        continue
      }
    }
    if (/\d/.test(char) && (found = match(numeric, code, at))) {
      add(found, "number")
      at += found.length
      last = "0"
      lastWasKeyword = false
      continue
    }
    if ((found = match(word, code, at))) {
      const end = at + found.length
      // A property (`a.default`) or a key (`{ type: … }`, `default?: number`) only looks like a keyword.
      const isKey = ((last === "{" || last === ",") && /^\s*:/.test(code.slice(end, end + 6))) || code.startsWith("?:", end)
      const isKeyword = code[at - 1] !== "." && !isKey && (keywords.has(found) || keywordHere(found, code, at, end))
      add(found, isKeyword ? "keyword" : undefined)
      at = end
      last = found
      lastWasKeyword = isKeyword
      continue
    }
    if (char === "{") frame.depth++
    else if (char === "}") {
      // The brace that closes a JSX expression goes back to the tag or the text it sits in.
      if (frame.depth === 0 && stack.length > 1) stack.pop()
      else frame.depth--
    }
    add(char)
    at++
    last = char
    lastWasKeyword = false
  }
  return tokens
}

/** A template string from its opening backtick: the text is a string, each ${…} is code. Returns where it ends. */
function scanTemplate(code: string, start: number, add: (text: string, kind?: CodeTokenKind) => void) {
  let at = start + 1
  let from = start
  while (at < code.length) {
    const char = code[at]
    if (char === "\\") at += 2
    else if (char === "`") {
      at++
      break
    } else if (char === "$" && code[at + 1] === "{") {
      add(code.slice(from, at), "string")
      let depth = 0
      let end = at + 2
      for (; end < code.length; end++) {
        if (code[end] === "{") depth++
        else if (code[end] === "}") {
          if (depth === 0) break
          depth--
        }
      }
      add("${")
      for (const token of scanScript(code.slice(at + 2, end), false)) add(token.text, token.kind)
      if (end < code.length) add("}")
      at = Math.min(end + 1, code.length)
      from = at
    } else at++
  }
  at = Math.min(at, code.length)
  add(code.slice(from, at), "string")
  return at
}

// ── JSON ─────────────────────────────────────────────────────────────────────────────────────────────────────────

const jsonNumber = /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const jsonOther = /[^"\d/-]+/y

function scanJson(code: string): CodeToken[] {
  const { tokens, add } = collector()
  let at = 0
  while (at < code.length) {
    const char = code[at]!
    let found: string | null
    if (char === '"') add((found = match(doubleQuoted, code, at) ?? char), "string")
    else if ((found = match(lineComment, code, at) ?? match(blockComment, code, at))) add(found, "comment")
    else if (!isWordChar(code[at - 1]) && (found = match(jsonNumber, code, at))) add(found, "number")
    else add((found = match(jsonOther, code, at) ?? char))
    at += found.length
  }
  return tokens
}

// ── CSS ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const cssString = /"(?:\\[\s\S]|[^"\\\n])*"?|'(?:\\[\s\S]|[^'\\\n])*'?/y
const cssAtRule = /@[\w-]+/y
const cssNumber = /-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/y
// Names, custom properties and hex colors: taken whole, so the digits inside them stay plain (h1, --space-2, #1d4ed8).
const cssName = /[#.]?-{0,2}[A-Za-z_][\w-]*|#[\da-fA-F]+/y

function scanCss(code: string): CodeToken[] {
  const { tokens, add } = collector()
  let at = 0
  while (at < code.length) {
    const char = code[at]!
    let found: string | null
    if ((found = match(blockComment, code, at))) add(found, "comment")
    else if ((char === '"' || char === "'") && (found = match(cssString, code, at))) add(found, "string")
    else if ((found = match(cssAtRule, code, at))) add(found, "keyword")
    else if ((found = match(cssName, code, at))) add(found)
    else if ((found = match(cssNumber, code, at))) add(found, "number")
    else add((found = char))
    at += found.length
  }
  return tokens
}

// ── Shell ────────────────────────────────────────────────────────────────────────────────────────────────────────

const shellComment = /#[^\n]*/y
const shellDouble = /"(?:\\[\s\S]|[^"\\])*"?/y
const shellSingle = /'[^']*'?/y
const shellWord = /[^\s"'#;|&()]+/y
// Only where a command starts: `for f in *.ts; do …; done`, `export NODE_ENV=production`.
const shellKeywords = new Set("if then else elif fi for while until do done case esac function export local return".split(" "))

function scanShell(code: string): CodeToken[] {
  const { tokens, add } = collector()
  let at = 0
  let commandStart = true
  while (at < code.length) {
    const char = code[at]!
    let found: string | null
    if (char === "\n") {
      add((found = char))
      commandStart = true
    } else if ((found = match(/[^\S\n]+/y, code, at))) add(found)
    else if (char === "#" && (at === 0 || /\s/.test(code[at - 1]!)) && (found = match(shellComment, code, at))) add(found, "comment")
    else if (char === '"' || char === "'") {
      add((found = match(char === '"' ? shellDouble : shellSingle, code, at) ?? char), "string")
      commandStart = false
    } else if ((found = match(shellWord, code, at))) {
      add(found, commandStart && shellKeywords.has(found) ? "keyword" : undefined)
      // After `then`, `do` or `else` another command starts.
      commandStart = commandStart && ["then", "do", "else"].includes(found)
    } else {
      add((found = char))
      commandStart = ";|&(".includes(char)
    }
    at += found.length
  }
  return tokens
}
