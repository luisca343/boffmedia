import fs from 'fs'
import path from 'path'
import type { BookStackPage } from '../shared/types.js'
import { REPO_ROOT } from './runner.js'

const BASE = process.env.BOOKSTACK_URL!
const HEADERS = {
  Authorization: `Token ${process.env.BOOKSTACK_TOKEN}:${process.env.BOOKSTACK_SECRET}`,
  'Content-Type': 'application/json'
}

async function bsGet(apiPath: string) {
  const r = await fetch(`${BASE}/api/${apiPath}`, { headers: HEADERS })
  if (!r.ok) throw new Error(`BookStack GET ${apiPath} failed: ${r.status}`)
  return r.json()
}

async function bsPost(apiPath: string, body: object) {
  const r = await fetch(`${BASE}/api/${apiPath}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`BookStack POST ${apiPath} failed: ${r.status}`)
  return r.json()
}

async function bsPut(apiPath: string, body: object) {
  const r = await fetch(`${BASE}/api/${apiPath}`, {
    method: 'PUT',
    headers: HEADERS,
    body: JSON.stringify(body)
  })
  if (!r.ok) throw new Error(`BookStack PUT ${apiPath} failed: ${r.status}`)
  return r.json()
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, content) =>
      `${'#'.repeat(Number(level))} ${content.replace(/<[^>]+>/g, '')}\n`
    )
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// Structure creation helpers

export async function createBookStackShelf(input: {
  name: string
  description?: string
  books?: number[]
}): Promise<{ shelfId: number; url: string }> {
  const result = await bsPost('shelves', {
    name: input.name,
    description: input.description ?? '',
    books: input.books ?? []
  })
  return { shelfId: result.id, url: result.url }
}

export async function createBookStackBook(input: {
  name: string
  description?: string
}): Promise<{ bookId: number; url: string }> {
  const result = await bsPost('books', {
    name: input.name,
    description: input.description ?? ''
  })
  return { bookId: result.id, url: result.url }
}

export async function addBooksToShelf(input: {
  shelfId: number
  bookIds: number[]
}): Promise<void> {
  await bsPut(`shelves/${input.shelfId}`, { books: input.bookIds })
}

export async function createBookStackChapter(input: {
  bookId: number
  name: string
  description?: string
}): Promise<{ chapterId: number; url: string }> {
  const result = await bsPost('chapters', {
    book_id: input.bookId,
    name: input.name,
    description: input.description ?? ''
  })
  return { chapterId: result.id, url: result.url }
}

// E4: update the status:* tag on a task page without touching its content
export async function updateTaskStatus(
  pageId: number,
  status: 'pending' | 'in-progress' | 'done'
): Promise<void> {
  const page = await bsGet(`pages/${pageId}`)
  const currentTags: string[] = page.tags?.map((t: { name: string }) => t.name) ?? []
  const newTags = [
    ...currentTags.filter((t: string) => !t.startsWith('status:')),
    `status:${status}`
  ]
  await bsPut(`pages/${pageId}`, { tags: newTags.map((name: string) => ({ name })) })
}

// E2: infer project tag from task description
export function inferProjectTag(text: string): 'boffmedia' | 'smartrotom' {
  const lower = text.toLowerCase()
  if (/smartrotom|minecraft|rotom/.test(lower)) return 'smartrotom'
  return 'boffmedia'
}

// E1: fetch a BookStack page by ID or URL
export async function fetchBookStackPage(input: {
  pageId?: number
  url?: string
}): Promise<BookStackPage> {
  let id = input.pageId

  if (!id && input.url) {
    const slug = input.url.split('/').pop()
    const results = await bsGet(`pages?filter[slug]=${slug}`)
    id = results.data[0]?.id
    if (!id) throw new Error(`No BookStack page found for URL: ${input.url}`)
  }

  if (!id) throw new Error('pageId or url required')

  const page = await bsGet(`pages/${id}`)

  return {
    title: page.name,
    content: page.markdown || htmlToMarkdown(page.html),
    tags: page.tags?.map((t: { name: string }) => t.name) ?? [],
    updatedAt: page.updated_at
  }
}

// E2: search BookStack by query + optional tag filter
export async function searchBookStack(input: {
  query: string
  tags?: string[]
  limit?: number
}): Promise<Array<{ pageId: number; title: string; excerpt: string; bookName: string }>> {
  const tagFilter = input.tags?.map(t => `filter[tags]=${encodeURIComponent(t)}`).join('&') ?? ''
  const results = await bsGet(
    `search?query=${encodeURIComponent(input.query)}&count=${input.limit ?? 5}${tagFilter ? `&${tagFilter}` : ''}`
  )

  return (results.data ?? [])
    .filter((r: { type?: string }) => !r.type || r.type === 'page')
    .map((r: { id: number; name: string; preview_html?: { body?: string } | string; book_name?: string }) => {
      const rawPreview = typeof r.preview_html === 'string'
        ? r.preview_html
        : (r.preview_html?.body ?? '')
      return {
        pageId: r.id,
        title: r.name,
        excerpt: rawPreview.replace(/<[^>]+>/g, '').slice(0, 200),
        bookName: r.book_name ?? ''
      }
    })
}

// E3: create or update a BookStack page (never touches agent:readonly pages)
export async function writeBookStackPage(input: {
  bookId: number
  chapterId?: number
  pageId?: number
  title: string
  content: string
  tags?: string[]
}): Promise<{ pageId: number; url: string }> {
  if (input.pageId) {
    const existing = await bsGet(`pages/${input.pageId}`)
    const isReadonly = existing.tags?.some((t: { name: string }) => t.name === 'agent:readonly')
    if (isReadonly) throw new Error(`Page ${input.pageId} is tagged agent:readonly — cannot overwrite`)
  }

  const body = {
    book_id: input.bookId,
    ...(input.chapterId ? { chapter_id: input.chapterId } : {}),
    name: input.title,
    markdown: input.content,
    tags: input.tags?.map(name => ({ name })) ?? []
  }

  const result = input.pageId
    ? await bsPut(`pages/${input.pageId}`, body)
    : await bsPost('pages', body)

  return { pageId: result.id, url: result.url }
}

// E3: write a changelog entry to the project's changelog page
export async function writeChangelog(input: {
  bookId: number
  pageId: number
  date: string
  title: string
  branch: string
  commitSha: string
  runId: string
  verificationSummary: string
  description: string
}): Promise<void> {
  const existing = await bsGet(`pages/${input.pageId}`)
  const existingContent: string = existing.markdown || htmlToMarkdown(existing.html)

  const entry = `
## ${input.date} — ${input.title}

**Branch**: ${input.branch}
**Commit**: ${input.commitSha}
**Run ID**: ${input.runId}
**Verification**: ${input.verificationSummary}

${input.description}

---
`

  await writeBookStackPage({
    bookId: input.bookId,
    pageId: input.pageId,
    title: existing.name,
    content: entry + existingContent,
    tags: existing.tags?.map((t: { name: string }) => t.name) ?? []
  })
}

// E4: list agent:task pages for a project — grouped by plan chapter vs standalone
export async function listBookStackTasks(input: {
  project: 'boffmedia' | 'smartrotom'
  status?: 'draft' | 'pending' | 'in-progress' | 'done' | 'all'
  planId?: string
}): Promise<{
  plans: Array<{
    planId: string
    chapterName: string
    chapterId: number
    tasks: Array<{ pageId: number; title: string; status: string; order: number; url: string }>
  }>
  standalone: Array<{ pageId: number; title: string; status: string; url: string }>
}> {
  const tagQuery = `[agent:task] [${input.project}]`
  const results = await bsGet(`search?query=${encodeURIComponent(tagQuery)}&count=50`)

  type RawPage = {
    id: number
    name: string
    chapter_id?: number
    tags?: Array<{ name: string }>
    url: string
    type?: string
  }

  const pages: RawPage[] = (results.data ?? []).filter(
    (r: RawPage) => r.type === 'page' || !r.type
  )

  // Status filter
  const statusFiltered = pages.filter(p => {
    if (!input.status || input.status === 'all') return true
    return p.tags?.some(t => t.name === `status:${input.status}`)
  })

  // planId filter
  const planFiltered = input.planId
    ? statusFiltered.filter(p => p.tags?.some(t => t.name === `plan:${input.planId}`))
    : statusFiltered

  // Separate plan pages from standalone pages
  const planPages: RawPage[] = []
  const standalonePages: RawPage[] = []
  for (const p of planFiltered) {
    const hasPlanTag = p.tags?.some(t => t.name.startsWith('plan:'))
    if (hasPlanTag) {
      planPages.push(p)
    } else {
      standalonePages.push(p)
    }
  }

  // Fetch unique chapter names for plan pages
  const uniqueChapterIds = [
    ...new Set(planPages.map(p => p.chapter_id).filter((id): id is number => id != null))
  ]
  const chapterNames: Record<number, string> = {}
  await Promise.all(
    uniqueChapterIds.map(async chapterId => {
      try {
        const ch = await bsGet(`chapters/${chapterId}`)
        chapterNames[chapterId] = ch.name
      } catch {
        chapterNames[chapterId] = `Chapter ${chapterId}`
      }
    })
  )

  // Group plan pages by planId and sort by order:N tag
  const planGroups = new Map<string, {
    planId: string
    chapterName: string
    chapterId: number
    tasks: Array<{ pageId: number; title: string; status: string; order: number; url: string }>
  }>()

  for (const p of planPages) {
    const planTag = p.tags?.find(t => t.name.startsWith('plan:'))
    const planId = planTag?.name.replace('plan:', '') ?? 'unknown'
    const orderTag = p.tags?.find(t => t.name.startsWith('order:'))
    const order = orderTag ? parseInt(orderTag.name.replace('order:', ''), 10) : 999
    const statusTag = p.tags?.find(t => t.name.startsWith('status:'))
    const status = statusTag?.name.replace('status:', '') ?? 'unknown'

    if (!planGroups.has(planId)) {
      planGroups.set(planId, {
        planId,
        chapterId: p.chapter_id ?? 0,
        chapterName: p.chapter_id
          ? (chapterNames[p.chapter_id] ?? `Chapter ${p.chapter_id}`)
          : 'Unknown chapter',
        tasks: []
      })
    }
    planGroups.get(planId)!.tasks.push({ pageId: p.id, title: p.name, status, order, url: p.url })
  }

  for (const group of planGroups.values()) {
    group.tasks.sort((a, b) => a.order - b.order)
  }

  return {
    plans: Array.from(planGroups.values()),
    standalone: standalonePages.map(p => {
      const statusTag = p.tags?.find(t => t.name.startsWith('status:'))
      return {
        pageId: p.id,
        title: p.name,
        status: statusTag?.name.replace('status:', '') ?? 'unknown',
        url: p.url
      }
    })
  }
}

// E5: write an ADR page to the project's ADR chapter
export async function writeAdr(input: {
  bookId: number
  chapterId: number
  title: string
  context: string
  decision: string
  consequences: string
  project: 'boffmedia' | 'smartrotom'
  runId: string
  branch?: string
}): Promise<{ pageId: number; url: string }> {
  const date = new Date().toISOString().slice(0, 10)
  // Fix 13: include branch link for traceability back to the code change
  const footer = input.branch
    ? `\n---\n*Recorded by harness agent · Run ID: \`${input.runId}\` · Branch: \`${input.branch}\`*`
    : `\n---\n*Recorded by harness agent · Run ID: \`${input.runId}\`*`
  const content = `> Auto-generated by harness agent on ${date} · Run ID: \`${input.runId}\`

## Context
${input.context}

## Decision
${input.decision}

## Consequences
${input.consequences}
${footer}
`

  return writeBookStackPage({
    bookId: input.bookId,
    chapterId: input.chapterId,
    title: `ADR: ${input.title}`,
    content,
    tags: ['adr', 'agent:generated', input.project]
  })
}

// E5: sync CONVENTIONS.md to the BookStack conventions page
export async function syncConventions(input: {
  bookId: number
  pageId: number
  project: 'boffmedia' | 'smartrotom'
}): Promise<void> {
  const conventionsPath = path.join(REPO_ROOT, 'CONVENTIONS.md')
  if (!fs.existsSync(conventionsPath)) return

  const content = fs.readFileSync(conventionsPath, 'utf-8')

  await writeBookStackPage({
    bookId: input.bookId,
    pageId: input.pageId,
    title: `Conventions — ${input.project === 'boffmedia' ? 'Boffmedia' : 'SmartRotom'} monorepo`,
    content,
    tags: ['conventions', 'agent:generated', input.project]
  })
}
