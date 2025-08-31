import MenuWrapper from "../_components/MenuWrapper";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/primitives/collapsible";
import { Drop, DropByType } from "../_types/Drops";
import { MinaService } from "@/services/api/smartrotom/minaService";

export default async function Drops() {
  const { drops, totalValue } = (await MinaService.getRewardsByType()).data as {drops: DropByType, totalValue: number};
  if(!drops) return <></>
  return (
    <MenuWrapper className="w-full min-h-full overflow-hidden bg-surface-900 text-white pt-4   flex flex-col items-center">
      <div className="bg-black bg-opacity-70 p-6 rounded-lg w-3/4 max-w-full">
        <h2 className="text-2xl font-bold mb-4">DROPS</h2>
        <div className="space-y-4 overflow-auto">
          {Object.keys(drops).map((type: string) => (
            <Collapsible key={type}>
              <CollapsibleTrigger className="mx-auto text-2xl p-4 border-b  shadow flex flex-col items-center m-2 w-[80%] text-surface-300">
                {type} - {getPercentage(drops[type].totalValue, totalValue)}%
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-wrap justify-center mx-auto w-4/5">
                  {drops[type].items.map((drop: Drop) => (
                    <div
                      key={drop.id}
                      className="p-4  rounded  flex flex-col items-center m-2 "
                    >
                      <img
                        src={`/smartrotom/img/apps/mina/recompensas/${
                          drop.itemId.split(":")[1]
                        }.png`}
                        alt={drop.name}
                        className="w-12 h-12 mb-2"
                        style={{ imageRendering: "pixelated" }}
                      />
                      <p className="text-surface-300 text-center text-lg ">{drop.name}</p>
                      <p className="text-surface-300 text-center text-md ">
                        {getPercentage(drop.value, totalValue)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </MenuWrapper>
  );
}

function getPercentage(value: number, total: number) {
  return ((value / total) * 100.0).toFixed(3);
}
