import { Watch } from "../_components/Watch"

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <Watch id={id} />
}
