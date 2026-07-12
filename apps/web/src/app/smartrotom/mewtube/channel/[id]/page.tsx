import { ChannelView } from "../_components/ChannelView"

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChannelView id={id} />
}
