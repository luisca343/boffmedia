import BoffLayout from "../_components/BoffLayout";
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
    <BoffLayout footer={false}>
      <div className="container mx-auto p-4">
        <FileTree structure={fileStructure} />
      </div>
    </BoffLayout>
  );
}