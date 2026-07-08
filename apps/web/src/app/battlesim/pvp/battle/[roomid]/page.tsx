import { redirect } from 'next/navigation';

export default async function LegacyPvpBattleRedirect({ params }: { params: Promise<{ roomid: string }> }) {
  const { roomid } = await params;
  redirect(`/pokemon/battlesim/pvp/battle/${roomid}`);
}
