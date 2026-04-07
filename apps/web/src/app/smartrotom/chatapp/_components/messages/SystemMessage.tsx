export function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center text-sm text-surface-500">
      <span className="px-2 my-1 bg-surface-200 rounded-lg">{content}</span>
    </div>
  )
}
