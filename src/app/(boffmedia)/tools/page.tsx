import FileTree from "./_components/FileTree";

const fileStructure = {
  pokemon: {
    pmdsky: "Generador de Correos Mundo Misterioso",
  },
  otros: {
    keys: "Claves de Steam"
  }
};

export default function FileStructurePage() {
  return (
    <div className="bg-gray-900  min-h-full">
      <div className="container mx-auto p-4 ">
        <FileTree structure={fileStructure} />
      </div>
    </div>
  );
}
