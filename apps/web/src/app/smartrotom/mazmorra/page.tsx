import { redirect } from 'next/navigation';

/** The leaderboard is the only dungeon page so far. */
export default function Mazmorra() {
  redirect('/smartrotom/mazmorra/ranking');
}
