import { Hora } from "@/components/Hora";
import {AppLink} from "@/components/smartrotom/AppLink";
import { rotomGET } from "@/services/boffAPI";

export default async function SmartrotomHome() {
  const datos = await rotomGET('/apps')

  return (
    <main className="h-full w-full bg-wingull bg-center bg-no-repeat bg-cover bg-fixed flex flex-col">
      <Hora className="p-5 text-white text-7xl lg:text-8xl col-span-6 text-center text-shadow-gray-border3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 content-between gap-y-1 pb-4 overflow-auto flex-1">  
          {datos?.map((app) => (
            <AppLink app={app} key={app.id} />
          ))}
      </div>
    </main>
  );
}
