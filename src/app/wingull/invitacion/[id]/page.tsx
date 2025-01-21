import { wingullGET } from "@/services/boffAPI";
import InvitacionForm from "./_components/InvitacionForm";
import InvitacionNoEncontrada from "./_components/InvitacionNoEncontrada";
import InvitacionUsada from "./_components/InvitacionUsada";

export default async function Invitacion({
  params,
}: {
  params: { id: string };
}) {
  const invitacion = (await wingullGET(`/invites/${params.id}`)).data as any;

  if (!invitacion?.id) return <InvitacionNoEncontrada id={params.id} />;
  if (invitacion.usedAt) return <InvitacionUsada id={params.id} />;

  return <InvitacionForm invitacion={invitacion} />;
}