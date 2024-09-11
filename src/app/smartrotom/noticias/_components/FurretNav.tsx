import { InternalLink } from "@/components/nav/Link";

export default function FurretNav(){
    return <nav className="h-12 bg-pink-400 flex items-center border-b-4 border-black">
    <img src="/smartrotom/img/apps/noticias.webp" alt="logo de noticiero" className="ml-2 w-10 h-10"/>
        <InternalLink href="/noticias" className="ml-4 text-black font-bold hover:underline">Noticias</InternalLink>
        <InternalLink href="/noticias/editar" className="ml-4 text-black font-bold hover:underline">Editar</InternalLink>
</nav>
}