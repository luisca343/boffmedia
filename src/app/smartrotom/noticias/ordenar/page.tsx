import { InternalLink } from "@/components/nav/Link";

export default function OrdenarNoticias(){
    return (
        <div>
            <nav className="h-8 bg-pink-400 flex items-center">
                <InternalLink href="/noticias/editar">Editar</InternalLink>
            </nav>
            <h1>Noticiero Furret Today</h1>
            <p>Noticias de la semana</p>
            <div className="flex">
                <div className="w-2/3 h-96 border border-black">
                    <h2>Noticia 1</h2>
                    <p>Contenido de la noticia 1</p>
                </div>
                <div className="w-1/3 border border-black">
                    <h2>Noticia 2</h2>
                    <p>Contenido de la noticia 2</p>
                </div>
            </div>
        </div>
    )
}