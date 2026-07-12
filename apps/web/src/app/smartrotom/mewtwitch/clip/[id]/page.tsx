import { ClipView } from "../_components/ClipView"

export default async function ClipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ClipView id={id} />
}
