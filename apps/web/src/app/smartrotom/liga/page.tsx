import { getTranslations } from "next-intl/server";
import { InternalLink } from "@/components/ui/navigation/Link";

export default async function LigaPokemon() {
  const t = await getTranslations("liga.nav");

  return (
    <InternalLink href="liga/camaralucha">
      <div className="bg-red-500 w-1/2 h-1/2">{t("camaraLucha")}</div>
    </InternalLink>
  );
}
