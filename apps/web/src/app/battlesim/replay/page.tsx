import { Game } from './_components/Game';
import { AchievementService } from '@/services/api/smartrotom/achievementsService';

export const dynamic = 'force-dynamic';

export default async function ReplayPage() {
  const replayData = (await AchievementService.getReplay("67d9b543-5ac9-41e1-a8a5-20d7689e24a4", 62)).data as any
  return (
    <section className="flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <Game replayData={replayData} />
    </section>
  );
}
