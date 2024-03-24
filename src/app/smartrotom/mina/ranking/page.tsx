import { rotomGET } from "@/services/boffAPI";
import MenuWrapper from "../_components/MenuWrapper";

export default async function Ranking(){
    const ranking = await rotomGET('/mine/ranking');
    return(
        <MenuWrapper>
            {ranking?.map((user: any, i: number) => {
                return (
                    <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-gray-900 bg-opacity-80">
                        <p className="text-gray-400">{user.username}</p>
                        <p className="text-gray-400">{user.valor}</p>
                    </div>
                )
            })}
        </MenuWrapper>
    )
}