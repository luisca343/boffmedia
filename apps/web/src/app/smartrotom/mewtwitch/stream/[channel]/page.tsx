import { Live } from "../_components/Live"

export default async function StreamPage({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params
  return <Live channel={channel} />
}
