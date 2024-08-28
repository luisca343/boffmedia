

import { rotomGET, wingullGET } from "@/services/boffAPI"
import { z } from 'zod';
import InvitacionForm from "./InvitacionForm";

const formSchema = z.object({
  username: z.string(),
  mc_username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export default async function Invitacion({params}: {params: {id: string}}){
    const invitacion = await wingullGET(`/invites/${params.id}`)
    if(!invitacion?.id) return(<h1>Invitacion no encontrada {params.id}</h1>)
    if(invitacion.usedAt) return(<h1>Invitacion ya usada {params.id}</h1>)

    return(
        <div className="h-full bg-cover flex items-center justify-center bg-main-200" style={{ backgroundImage: "url('https://i.lizardon.es/pixelmon/img/wood.webp')" }}>
            <InvitacionForm invitacion={invitacion}/>
        </div>
    )
}




/*

        <div className="h-full bg-cover flex items-center justify-center bg-main-200" style={{ backgroundImage: "url('https://i.lizardon.es/pixelmon/img/wood.webp')" }}>
            <div className="w-full max-w-md bg-main-50 p-8 m-4 rounded shadow-md">
                <h1 className="block w-full text-center text-main-800 text-2xl font-bold mb-6">Teras? Teras</h1>
                <form className="mb-4 md:flex md:flex-wrap md:justify-between">
                    <div className="flex flex-col mb-4 md:w-full">
                        <label className="mb-2 font-bold text-lg text-main-900" htmlFor="username">Username</label>
                        <input className="border py-2 px-3 text-grey-darkest" type="text" name="username" id="username"  defaultValue={invitacion.username}/>
                    </div>
                    <div className="flex flex-col mb-4 md:w-full">
                        <label className="mb-2 font-bold text-lg text-main-900" htmlFor="mc_username">MC Username</label>
                        <input className="border py-2 px-3 text-grey-darkest" type="text" name="mc_username" id="mc_username" defaultValue={invitacion.username}/>
                    </div>
                    <div className="flex flex-col mb-4 md:w-full">
                        <label className="mb-2 font-bold text-lg text-main-900" htmlFor="email">Email</label>
                        <input className="border py-2 px-3 text-grey-darkest" type="email" name="email" id="email" />
                    </div>
                    <div className="flex flex-col mb-6 md:w-full">
                        <label className="mb-2 font-bold text-lg text-main-900" htmlFor="password">Password</label>
                        <input className="border py-2 px-3 text-grey-darkest" type="password" name="password" id="password" />
                    </div>
                    <div className="flex items-center justify-between">
                        <button className="w-full bg-blue-500 hover:bg-blue-700 text-main-50 font-bold py-2 px-4 rounded" type="button">
                            Register
                        </button>
                    </div>
                </form>
            </div>
        </div>

*/