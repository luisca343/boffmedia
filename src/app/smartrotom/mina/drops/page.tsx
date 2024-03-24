import { rotomGET } from "@/services/boffAPI";
import MenuWrapper from "../_components/MenuWrapper";

export default async function Drops(){
    const drops = await rotomGET('/mina/recompensas');
    return(
        <MenuWrapper>
            {drops?.map((drop: any, i: number) => {
                return (
                    <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-gray-900 bg-opacity-80">
                        <p className="text-gray-400">{drop.nombre}</p>
                        <p className="text-gray-400">{drop.valor}</p>
                    </div>
                )
            })}
        </MenuWrapper>
    )
}