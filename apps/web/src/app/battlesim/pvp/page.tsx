import { redirect } from 'next/navigation';

export default function LegacyPvpRedirect() {
  redirect('/pokemon/battlesim/pvp');
}
