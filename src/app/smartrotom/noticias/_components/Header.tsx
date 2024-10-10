export default function FurretHeader() {
  return (
    <header className="bg-pink-500 text-white p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23fff%22 fill-opacity=%220.5%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
      <div className="relative z-10">
        <h1 className="text-8xl font-bold mb-2 text-yellow-300 pop-shadow">
          Noticiero Furret Today
        </h1>
        <p className="text-2xl italic text-white pop-shadow">
          ¡Las Noticias Pokémon Más POP-ulares!
        </p>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%22100%22 height=%22100%22%3E%3Cpath d=%22M50 0 L100 50 L50 100 L0 50 Z%22 fill=%22%23FFF700%22 /%3E%3C%2Fsvg%3E')] bg-center opacity-20"></div>
    </header>
  );
}
