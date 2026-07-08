import { redirect } from 'next/navigation';

export default function LegacyReplayRedirect() {
  redirect('/pokemon/battlesim/replay');
}
