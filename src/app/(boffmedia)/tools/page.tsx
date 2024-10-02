import FileTree from "./_components/FileTree";

const fileStructure = {
  pokemon: {
    pmdsky: "Generador de Correos Mundo Misterioso",
  },
};

export default function FileStructurePage() {
  return (
    <div className="bg-main-900  min-h-full">
      <div className="container mx-auto p-4 ">
        <FileTree structure={fileStructure} />
      </div>
    </div>
  );
}
