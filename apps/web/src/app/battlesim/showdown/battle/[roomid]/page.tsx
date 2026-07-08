import { redirect } from 'next/navigation';

export default async function LegacyShowdownBattleRedirect({ params }: { params: Promise<{ roomid: string }> }) {
  const { roomid } = await params;
  redirect(`/pokemon/battlesim/showdown/battle/${roomid}`);
}
