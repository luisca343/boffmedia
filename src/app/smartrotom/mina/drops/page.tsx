import { rotomGET } from "@/services/boffAPI";
import MenuWrapper from "../_components/MenuWrapper";

export default async function Drops(){
    const drops = await rotomGET('/mine/rewards');
    return(
        <MenuWrapper>
            <div>
                {drops?.map((drop: any, i: number) => {
                    return (
                        <div key={i} className="p-4 border rounded shadow  w-auto flex flex-col items-center m-2  bg-main-900 bg-opacity-80">
                            <p className="text-gray-400">{drop.name}</p>
                            <p className="text-gray-400">{drop.value}</p>
                        </div>
                    )
                })}
            </div>
        </MenuWrapper>
    )
}