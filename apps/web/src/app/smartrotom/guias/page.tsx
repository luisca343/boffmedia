import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { isAppHidden } from "../_config/hidden-apps";

export default async function Guias() {
  // Hidden indefinitely — this stub app was never completed.
  if (isAppHidden("guias")) {
    redirect("/smartrotom");
  }

  const t = await getTranslations("guias.page");

  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">{t("title")}</h1>
    </div>
  );
}
