import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { TeamBuilderRouted } from "./_components/TeamBuilderRouted";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("games.pokemon.tools.teambuilder") };
}

export default function TeamBuilderPage() {
  return (
    <Suspense>
      <TeamBuilderRouted />
    </Suspense>
  );
}
