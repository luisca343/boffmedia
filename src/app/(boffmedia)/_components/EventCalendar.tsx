import { Calendar } from "lucide-react";

/*
const events = [
    { date: "15 Oct", event: "Torneo Pixelmon", time: "18:00" },
    { date: "22 Oct", event: "Minecraft Bingo", time: "20:00" },
    { date: "29 Oct", event: "Noche de ZomBOFF", time: "22:00" },
    { date: "5 Nov", event: "Carrera de Elytra", time: "19:00" },
    { date: "12 Nov", event: "Batalla de Constructores", time: "17:00" },
    { date: "19 Nov", event: "Maratón de Supervivencia", time: "15:00" },
  ];
*/

const events = [] as {
  date: string;
  event: string;
  time: string;
}[];

export default function EventCalendar() {
  return (
    <div className="bg-main-800 p-6 rounded-lg border border-main-700 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length > 0 ? (
          events.map((item, index) => (
            <EventCalendarElement key={index} {...item} />
          ))
        ) : (
          <NoEventsMessage />
        )}
      </div>
    </div>
  );
}

function EventCalendarElement({
  date,
  event,
  time,
}: {
  date: string;
  event: string;
  time: string;
}) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-main-700 rounded-lg">
      <Calendar className="w-8 h-8 text-yellow-400" />
      <div>
        <p className="font-bold text-white">{event}</p>
        <p className="text-main-300">
          {date} - {time}
        </p>
      </div>
    </div>
  );
}

function NoEventsMessage() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-8 bg-main-700 rounded-lg text-center">
      <Calendar className="w-16 h-16 text-yellow-400 mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">
        No hay eventos próximamente
      </h3>
      <p className="text-main-300">
        Estamos trabajando en traer nuevos eventos emocionantes. ¡Vuelve pronto!
      </p>
    </div>
  );
}
