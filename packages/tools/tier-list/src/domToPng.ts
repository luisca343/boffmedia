/** Capture a live DOM region using the browser's CSS renderer, with embedded assets. */
const assets = new Map<string, Promise<string>>()
let loading = 0
const waiting: (() => void)[] = []

async function loadAsset(url: string) {
  if (loading >= 6) await new Promise<void>((resolve) => waiting.push(resolve))
  else loading++
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error("Export asset could not be loaded")
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Export asset could not be read"))
      reader.readAsDataURL(blob)
    })
  } finally {
    const next = waiting.shift()
    if (next) next()
    else loading--
  }
}

function assetDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:")) return Promise.resolve(url)
  const cached = assets.get(url)
  if (cached) return cached
  // Static font/image assets only. Bound concurrency and retained data between exports.
  const pending = loadAsset(url)
  assets.set(url, pending)
  if (assets.size > 128) assets.delete(assets.keys().next().value!)
  void pending.catch(() => { if (assets.get(url) === pending) assets.delete(url) })
  return pending
}

function copyStyle(style: CSSStyleDeclaration, target: HTMLElement | SVGElement) {
  for (const property of Array.from(style)) target.style.setProperty(property, style.getPropertyValue(property))
  target.style.animation = "none"
  target.style.transition = "none"
}

function fontRules(sheets: StyleSheetList): CSSFontFaceRule[] {
  const result: CSSFontFaceRule[] = []
  const read = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE) result.push(rule as CSSFontFaceRule)
      else if ("cssRules" in rule) read((rule as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(sheets)) {
    try { read(sheet.cssRules) } catch { /* Cross-origin sheets cannot expose their rules. */ }
  }
  return result
}

const familyName = (value: string) => value.split(",")[0].trim().replace(/^['"]|['"]$/g, "")

export async function domToPng(element: HTMLElement, scale = 2): Promise<Blob> {
  const doc = element.ownerDocument
  const win = doc.defaultView
  if (!win || !element.isConnected) throw new Error("Export region is unavailable")
  await doc.fonts.ready
  await Promise.all(Array.from(element.querySelectorAll("img")).map(async (img) => {
    const previousLoading = img.loading
    img.loading = "eager"
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      await Promise.race([img.decode().catch(() => {}), new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Export image took too long to load")), 10000)
      })])
    } finally { clearTimeout(timer); img.loading = previousLoading }
  }))
  // Let the live host paint its fallback when an image decode failed.
  await new Promise<void>((resolve) => win.requestAnimationFrame(() => resolve()))
  const bounds = element.getBoundingClientRect()
  const width = Math.ceil(bounds.width), height = Math.ceil(bounds.height)
  if (!width || !height || width * height * scale * scale > 64_000_000 || Math.max(width, height) * scale > 32767) {
    throw new Error("Board is too large for one image")
  }
  const fonts = new Map<string, Set<number>>()
  const jobs: Promise<unknown>[] = []
  const clone = (node: Node): Node => {
    if (!(node instanceof Element)) return node.cloneNode(false)
    const target = node.cloneNode(false) as HTMLElement | SVGElement
    const style = win.getComputedStyle(node)
    copyStyle(style, target)
    for (const property of ["background-image", "mask-image", "border-image-source"]) {
      const value = style.getPropertyValue(property)
      const urls = [...value.matchAll(/url\(["']?([^"')]+)["']?\)/g)].filter((match) => !match[1].startsWith("#"))
      if (urls.length) jobs.push(Promise.all(urls.map(async (match) => [match[0], await assetDataUrl(new URL(match[1], doc.baseURI).href)] as const))
        .then((replacements) => {
          let embedded = value
          for (const [source, data] of replacements) embedded = embedded.replaceAll(source, `url("${data}")`)
          target.style.setProperty(property, embedded)
        }))
    }
    const family = familyName(style.fontFamily)
    if (!fonts.has(family)) fonts.set(family, new Set())
    fonts.get(family)!.add(Number(style.fontWeight) || 400)
    const pseudo = (kind: "::before" | "::after") => {
      const computed = win.getComputedStyle(node, kind)
      if (!computed.content || ["none", "normal"].includes(computed.content) || computed.display === "none") return
      const child = doc.createElement("span")
      copyStyle(computed, child)
      child.textContent = computed.content.replace(/^['"]|['"]$/g, "")
      target.append(child)
    }
    pseudo("::before")
    for (const child of Array.from(node.childNodes)) target.append(clone(child))
    pseudo("::after")
    if (node instanceof HTMLImageElement) {
      target.removeAttribute("srcset"); target.removeAttribute("sizes"); target.removeAttribute("loading")
      if (node.naturalWidth) jobs.push(assetDataUrl(node.currentSrc || node.src).then((url) => target.setAttribute("src", url)))
      else target.removeAttribute("src")
    }
    return target
  }
  const captured = clone(element) as HTMLElement
  captured.style.width = `${width}px`; captured.style.height = `${height}px`
  captured.style.margin = "0"; captured.style.position = "relative"; captured.style.inset = "auto"
  let background = "rgb(255, 255, 255)"
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    const color = win.getComputedStyle(parent).backgroundColor
    if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") { background = color; break }
  }
  captured.style.backgroundColor = background
  const fontsReady = Promise.all(fontRules(doc.styleSheets).filter((rule) => {
    const weights = fonts.get(familyName(rule.style.fontFamily))
    const range = (rule.style.fontWeight || "400").split(/\s+/).map(Number)
    return weights && [...weights].some((weight) => weight >= range[0] && weight <= (range[1] ?? range[0]))
  }).map(async (rule) => {
    const src = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1]
    if (!src) throw new Error("Export font is unavailable")
    const data = await assetDataUrl(new URL(src, doc.baseURI).href)
    return `@font-face{font-family:${rule.style.fontFamily};font-weight:${rule.style.fontWeight};font-style:${rule.style.fontStyle};src:url("${data}");unicode-range:${rule.style.getPropertyValue("unicode-range") || "U+0-10FFFF"};}`
  }))
  const [embeddedFonts] = await Promise.all([fontsReady, Promise.all(jobs)])
  const wrapper = doc.createElement("div")
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
  const css = doc.createElement("style"); css.textContent = embeddedFonts.join("\n")
  wrapper.append(css, captured)
  const content = new XMLSerializer().serializeToString(wrapper)
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error("Browser could not render the export"))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${content}</foreignObject></svg>`)}`
  })
  const canvas = doc.createElement("canvas")
  canvas.width = width * scale; canvas.height = height * scale
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas is unavailable")
  context.scale(scale, scale); context.drawImage(image, 0, 0)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"))
}
