import FileTree from "./../_components/FileTree";

const fileStructure = {
  pokemon: {
    pmdsky: "Generador de Correos Mundo Misterioso",
    "tcgpocket/cartas": "Gestión colecciones TCG Pocket",
  },
  otros: {
    keys: "Claves de Steam",
  },
};

export default function FileStructurePage() {
  return (
    <div className="container mx-auto p-4">
      <FileTree structure={fileStructure} />
    </div>
  );
}
