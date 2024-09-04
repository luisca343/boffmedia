import { rotomGET } from "@/services/boffAPI";
import MenuWrapper from "../_components/MenuWrapper";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Drop = {
    id: number;
    value: number;
    name: string;
    type: string;
    itemId: string;
    width: number;
    height: number;
}

type DropByType = {
    [key: string]: {
        items: Drop[];
        totalValue: number;
    }
}

export default async function Drops() {
    const {drops, totalValue} = await rotomGET('/mine/rewardsbytype') as {drops: DropByType, totalValue: number};
    return (
        <MenuWrapper>
            <div>
                {Object.keys(drops).map((type: string) => (
                    <Collapsible key={type}>
                        <CollapsibleTrigger className="mx-auto text-2xl p-4 border rounded shadow flex flex-col items-center m-2 bg-main-900 bg-opacity-95 w-[90%] text-main-400">
                            {type} - {getPercentage(drops[type].totalValue, totalValue)}%
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="flex flex-wrap justify-center mx-auto w-4/5">
                                {drops[type].items.map((drop: Drop) => (
                                    <div key={drop.id} className="text-lg w-1/6 p-4 border rounded shadow flex flex-col items-center m-2 bg-main-900 bg-opacity-85">
                                        <img src={`/smartrotom/img/apps/mina/recompensas/${drop.itemId.split(':')[1]}.png`}
                                            alt={drop.name} 
                                            className="w-16 h-16 mb-2"
                                            style={{imageRendering: "pixelated"}}
                                        />
                                        <p className="text-main-400 text-center">{drop.name}</p>
                                        <p className="text-main-400 text-center">{getPercentage(drop.value, totalValue)}%</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ))}
            </div>
        </MenuWrapper>
    );
}

function getPercentage(value: number, total: number) {
    return (value / total * 100.0).toFixed(3);
}