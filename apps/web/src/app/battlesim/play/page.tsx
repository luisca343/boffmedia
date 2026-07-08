import { redirect } from 'next/navigation';

export default async function LegacyPlayRedirect({ searchParams }: { searchParams: Promise<{ format?: string }> }) {
  const sp = await searchParams;
  const q = sp?.format ? `?format=${encodeURIComponent(sp.format)}` : '';
  redirect(`/pokemon/battlesim/play${q}`);
}
