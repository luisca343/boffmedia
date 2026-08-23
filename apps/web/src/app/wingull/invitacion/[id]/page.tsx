import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { wingullGET } from "@/services/boffAPI";
import InvitacionForm from "./_components/InvitacionForm";
import InvitacionNoEncontrada from "./_components/InvitacionNoEncontrada";
import InvitacionUsada from "./_components/InvitacionUsada";
import { BackgroundDecorations } from "../../_components/BackgroundDecorations";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pageMeta.wingull")
  return { title: t("invitacion.title"), description: t("invitacion.description") }
}

export default async function Invitacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invitacion = (await wingullGET(`/invites/${id}`)).data as any;

  if (!invitacion?.id) return <InvitacionNoEncontrada id={id} />;
  if (invitacion.usedAt) return <InvitacionUsada id={id} />;

  return <div className="flex items-center justify-center relative py-8">
    <BackgroundDecorations />
    <InvitacionForm invitacion={invitacion} />;
  </div>
}