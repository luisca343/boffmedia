import { redirect } from 'next/navigation';

export default function LegacyShowdownRedirect() {
  redirect('/pokemon/battlesim/showdown');
}
