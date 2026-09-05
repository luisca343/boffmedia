import { redirect } from 'next/navigation';

export default async function LegacyReplayIdRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pokemon/battlesim/replay/${id}`);
}
