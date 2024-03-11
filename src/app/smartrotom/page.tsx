import { Hora } from "@/components/Hora";
import {AppLink, AppList} from "@/components/smartrotom/AppLink";
import { rotomGET } from "@/services/boffAPI";


type App = {
  id: number;
  name: string;
  description: string;
  url: string;
  icon: string;
}


export default async function SmartrotomHome() {

  return (
    <main className="h-full w-full bg-wingull bg-center bg-no-repeat bg-cover bg-fixed flex flex-col">
      <Hora className="p-5 text-white text-7xl lg:text-8xl col-span-6 text-center text-shadow-gray-border3" />
          <AppList />
    </main>
  );
}
