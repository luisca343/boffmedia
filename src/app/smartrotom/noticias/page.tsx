import MainCard from './_components/MainCard'
import CardComponent from './_components/CardComponent'
import PopStyles from './_components/PopStyles';

export interface NewsItem {
    id: number;
    title: string;
    subtitle?: string;
    content: string;
    buttonText: string;
    buttonClass?: string;
    imageUrl: string;
    }

export default function FurretTodayPopArtEspanol() {
    const news = [
        { id: 0, title: "¡GUAU!", subtitle: "¡El Descubrimiento Impactante de Furret!", content: "En un giro que ha dejado al mundo Pokémon boquiabierto, ¡Furret ha descubierto un talento oculto para el canto de ópera! Los testigos informan de notas agudas que rompen cristales y bajos que hacen temblar la tierra. ¿Es este el amanecer del estrellato Poké-pop?", buttonText: "¡Escucha la Sensación!", imageUrl: "/smartrotom/img/apps/noticias/default.webp" },
        { id: 1, title: "¡La Moda POP de Furret!", content: "¡Las rayas están pasadas de moda, los lunares están de moda! Furrets en todas partes lucen los últimos diseños de puntos. ¡Es una sensación moteada!", buttonText: "¡Tendencia!", imageUrl: "/smartrotom/img/apps/noticias/default.webp" },
        { id: 2, title: "¡Espectáculo del Atardecer!", content: "Furret organiza la primera fiesta mundial de observación de atardeceres Pokémon. ¡Miles se reúnen para ver el cielo explotar de color!", buttonText: "¡Únete a la Vista!", imageUrl: "/smartrotom/img/apps/noticias/default.webp" },
        { id: 3, title: "Rincón del Cómic", content: "Furret: Maestro del Disfraz - Nuestro héroe se infiltra en el Equipo Rocket haciéndose pasar por una bufanda. ¿Notarán la cola?", buttonText: "¡Desenreda la Historia!", imageUrl: "/smartrotom/img/apps/noticias/default.webp" },
        { id: 4, title: "El Festín Fantástico de Furret", content: "¡Furret local organiza una cena compartida e impresiona con platos gourmet de bayas!" },
        { id: 5, title: "Torneo de Retorcimiento de Cola", content: "¡La competición anual de retorcimiento de cola de Furret alcanza nuevas alturas de flexibilidad!" },
        { id: 6, title: "Cuidado del Pelaje Furrylicioso de Furret", content: "¡Se abre un salón de belleza para Furrets, ofreciendo días de spa y estilismo de pelaje!" },
        { id: 7, title: "Problemas en el Túnel", content: "¡El elaborado sistema de túneles de Furret causa un pequeño terremoto, geólogos asombrados!" },
        { id: 8, title: "Sorpresa en el Pokéathlon", content: "¡Furret gana el oro en un evento inesperado del Pokéathlon: siesta extrema!" },
        { id: 9, title: "Los Hallazgos Fabulosos de Furret", content: "¡Furret local inicia un negocio de búsqueda de tesoros y desentierra artefactos antiguos!" },
        { id: 10, title: "¡Furret en el Espacio!", content: "¡Furret se une a la tripulación de un cohete espacial y se convierte en el primer Pokémon en dar un paseo por la luna!" },
        { id: 11, title: "¡El Misterio de la Cola Desaparecida!", content: "¡Furret desafía a los detectives a resolver el misterio de la cola desaparecida!" },
        { id: 12, title: "¡Furret en la Gran Pantalla!", content: "¡Furret protagoniza una película de acción de alto octanaje, ¡con persecuciones de coches y explosiones!" },
        { id: 13, title: "El manifiesto comunista", content: "¡Furret se une a la lucha por la igualdad de los trabajadores y la abolición de la propiedad privada!" },
        { id: 14, title: "Furret bombardea Cantabria", content: "¡Furret lanza un ataque aéreo sobre la región de Cantabria, dejando a su paso un rastro de destrucción y caos!" },
        { id: 15, title: "Furret se convierte en el nuevo presidente de España", content: "¡Furret gana las elecciones presidenciales y se convierte en el nuevo líder de España, prometiendo un futuro brillante para todos los ciudadanos!" },
    
    ] as NewsItem[]

  return (
    <div className="min-h-full bg-yellow-300 text-black font-sans p-4 md:p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto bg-white shadow-[20px_20px_0_0_rgba(0,0,0,1)]">
        <header className="bg-red-500 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23fff%22 fill-opacity=%220.5%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
          <div className="relative z-10">
            <h1 className="text-8xl font-bold mb-2 text-yellow-300 pop-shadow">Noticiero Furret Today</h1>
            <p className="text-2xl italic text-white pop-shadow">¡Las Noticias Pokémon Más POP-ulares!</p>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%22100%22 height=%22100%22%3E%3Cpath d=%22M50 0 L100 50 L50 100 L0 50 Z%22 fill=%22%23FFF700%22 /%3E%3C%2Fsvg%3E')] bg-center opacity-20"></div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Ccircle cx=%222%22 cy=%222%22 r=%222%22 fill=%22%23000%22 fill-opacity=%220.1%22%2F%3E%3C%2Fsvg%3E')] bg-repeat">
          <MainCard news={news[0]}/>

          <div className="space-y-6">
            <CardComponent variant="pink" news={news[1]} />

            <CardComponent variant="red"news={news[2]}/>

            <CardComponent variant="yellow" news={news[3]} />
          </div>
        </main>

        <section className="p-6">
          <h2 className="text-5xl font-bold mb-6 text-center text-blue-500 pop-shadow">Más Noticias</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.slice(4).map((item, index) => (
              <CardComponent
                key={index}
                variant="blue"
                news={item}
              />
            ))}
          </div>
        </section>

        <footer className="bg-red-500 text-white p-6 text-center">
          <p className="font-bold text-2xl pop-shadow">&copy; 2024 Furret Today. ¡Gracias por leernos, sin ti no podríamos CA-MI-NAR!</p>
        </footer>
      </div>
      <PopStyles />
    </div>
  )
}