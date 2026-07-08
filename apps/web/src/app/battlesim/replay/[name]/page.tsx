import { redirect } from 'next/navigation';

export default async function LegacyReplayNameRedirect({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  redirect(`/pokemon/battlesim/replay/${name}`);
}
