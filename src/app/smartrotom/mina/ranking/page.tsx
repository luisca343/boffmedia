import { rotomGET } from "@/services/boffAPI";
import MenuWrapper from "../_components/MenuWrapper";

export default async function Ranking(){
    const ranking = await rotomGET('/mine/ranking')  as any[]
    return(
        <MenuWrapper>
            <div>
                {ranking?.map((user: any, i: number) => {
                    return (
                        <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-main-900 bg-opacity-80">
                            <p className="text-main-400">{user.username}</p>
                            <p className="text-main-400">{user.value}</p>
                        </div>
                    )
                })}
            </div>
        </MenuWrapper>
    )
}