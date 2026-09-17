import { Markdown } from "@boffmedia/ui"

// Forum posts use the shared first-party Markdown renderer so headings, lists,
// links and code blocks stay in step with changelog and other Boffmedia prose.
export function ForumMarkdown({ children }: { children: string }) {
  return <Markdown className="max-w-none">{children}</Markdown>
}
