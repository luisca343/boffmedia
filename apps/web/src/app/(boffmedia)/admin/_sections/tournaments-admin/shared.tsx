import { AvSectionHead } from "../../_components/ui/av-kit"

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return <AvSectionHead title={title} desc={sub} />
}
