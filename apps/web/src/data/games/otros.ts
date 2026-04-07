export const otrosToolsConfig = {
  name: "Otras Herramientas",
  logo: "/img/games/other/icon.webp",
  header: {
    title: { prefix: "Otras", highlight: "Herramientas" },
    subtitle: "Recursos útiles para gamers y creadores de contenido",
  },
  tools: [
    {
      title: "Sorteos",
      description: "Crea y gestiona sorteos para eventos y comunidades",
      icon: "/img/games/other/raffle.webp",
      fallbackIcon: "Gift",
      fallbackIconColor: "text-accent-400",
      href: "/sorteo",
      color: "from-accent-400 to-indigo-600",
      tools: ["Sorteos aleatorios", "Tickets personalizados", "Resultados en tiempo real"],
      featured: true,
    },
    {
      title: "Claves de Steam",
      description: "Gestiona y comparte claves de juegos de Steam",
      icon: "/img/games/other/key.webp",
      fallbackIcon: "Key",
      fallbackIconColor: "text-secondary-400",
      href: "/otros/keys",
      color: "from-secondary-400 to-cyan-600",
      tools: ["Biblioteca de claves", "Validador", "Historial de canjes"],
      featured: false,
    },
  ],
  externalLinks: [
    { href: "https://steamcommunity.com/", title: "Comunidad de Steam", description: "Foros, guías y más de la comunidad Steam" },
    { href: "https://www.humblebundle.com/", title: "Humble Bundle", description: "Juegos con descuento y paquetes benéficos" },
    { href: "https://boffmedia.com/guias", title: "Guías de BoffMedia", description: "Guías y tutoriales para tus juegos favoritos" },
  ],
};
