import { ForumPresence } from "./_components/ForumPresence"

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ForumPresence />
    </>
  )
}
