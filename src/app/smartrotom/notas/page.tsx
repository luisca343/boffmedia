import { DocumentsList } from "./_components/DocumentsList";

export default function NotesMenu(){

    return (
        <div className="bg-main-800  ">
            <h1 className="text-2xl text-white">Notas</h1>
            <DocumentsList />
        </div>
    )
}