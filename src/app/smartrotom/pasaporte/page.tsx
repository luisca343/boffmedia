'use client'
import { Book, Page } from "@/components/ui/book/book";
import './pasaporte.css'
import { useSession } from "next-auth/react";
import { BoffSession } from "@/components/smartrotom/AppWrapper";
import { CabezaJugador } from "@/components/smartrotom/CabezaMC";
import { useState } from "react";

export default function Pasaporte(){
  const [book, setBook] = useState(null) as any
  const {data: session} = useSession() as {data: BoffSession | null, status: string};
  const uuid = session?.user.smartRotomUser.uuid as string
  const username = session?.user.smartRotomUser.username as string

  let page  = 0;
    return(
      <section className=" bg-yellow-200 flex font-vinque bg-center bg-no-repeat bg-fixed bg-cover">
          <Book setBook={setBook}>
            <Page className="bg-blue-600 flex  flex-col " style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>
              <div className="text-center text-6xl mt-4 text-yellow-200 font-bold opacity-80" style={{ mixBlendMode: 'normal' }}>PASAPORTE</div>
              <img className="h-0 flex-1  opacity-80" src="/smartrotom/img/logo.webp" alt="description" style={{ mixBlendMode: 'normal' }} />
              <div className="mb-4 text-center text-4xl  text-yellow-200 font-bold  opacity-80" style={{ mixBlendMode: 'normal' }}>Región de Teras</div>
            </Page>
            <Page>
              <div className="flex flex-col">
                <div className="text-xl font-bold">Nombre: {username}</div>
                <div className="text-xl font-bold">UUID: {uuid}</div>
              </div>
            </Page>
            <Page>Page 2</Page>
            <Page>Page 3</Page>
            <Page>Page 4</Page>
            <Page>Page 5</Page>
            <Page>Page 6</Page>
            <Page style={{backgroundImage: `url(/smartrotom/img/apps/pasaporte/cuero.webp)`}}>Page 7</Page>
          </Book>
      </section>
    )
}