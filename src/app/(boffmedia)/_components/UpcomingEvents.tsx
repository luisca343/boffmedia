import { ChevronRight, Calendar } from "lucide-react";
import Link from "next/link";

const colors = {
  blue: {
    text: "#60a5fa",
    hover: "#93c5fd",
  },
  green: {
    text: "#4ade80",
    hover: "#86efac",
  },
  red: {
    text: "#f87171",
    hover: "#fca5a5",
  },
  yellow: {
    text: "#facc15",
    hover: "#fde047",
  },
  purple: {
    text: "#c084fc",
    hover: "#d8b4fe",
  },
};

type EventType = {
  name: string;
  description: string;
  color: keyof typeof colors;
};

const events = [] as EventType[];

/*
const events = [
    { name: "Minecraft Bingo", description: "¡Pon a prueba tu conocimiento y velocidad en Minecraft en nuestros emocionantes eventos de Bingo!", color: "blue" },
    { name: "Project ZomBOFF", description: "Sobrevive al apocalipsis zombi con amigos en nuestros servidores personalizados de Project Zomboid.", color: "green" },
] as unknown as EventType[];
 */


export function UpcomingEvents() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {events.length > 0 ? (
        events.map((event, index) => (
          <EventCard {...event} key={index} />
        ))
      ) : (
        <NoEventsCard />
      )}
    </div>
  );
}

function EventCard({
  name,
  description,
  color,
}: {
  name: string;
  description: string;
  color: keyof typeof colors;
}) {
  const colorData = colors[color] || colors.blue;
  return (
    <div
      className={`bg-main-800 p-6 rounded-lg border border-main-700 shadow-inner`}
    >
      <h3
        className={`text-2xl font-bold mb-4`}
        style={{ color: colorData.text }}
      >
        {name}
      </h3>
      <p className="text-main-300 mb-4">{description}</p>
      <Link
        href="/eventos/minecraft-bingo"
        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-bold"
      >
        Unirse al Evento
        <ChevronRight className="ml-1" />
      </Link>
    </div>
  );
}

function NoEventsCard() {
  return (
    <div className="md:col-span-2 bg-main-800 p-8 rounded-lg border border-main-700 shadow-inner text-center">
      <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-4 text-purple-400">No hay eventos próximos</h3>
      <p className="text-main-300 mb-6">
        Estamos preparando nuevos y emocionantes eventos para ti. ¡Vuelve pronto para descubrir qué tenemos planeado!
      </p>
      <Link
        href="/sugerir-evento"
        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-bold"
      >
        Sugerir un Evento
        <ChevronRight className="ml-1" />
      </Link>
    </div>
  );
}