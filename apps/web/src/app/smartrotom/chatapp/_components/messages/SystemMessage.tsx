export function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center text-sm text-ink-muted">
      <span className="px-2 my-1 bg-layer-2 rounded-lg">{content}</span>
    </div>
  )
}
