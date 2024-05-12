import { Hora } from "@/components/Hora";
import {AppList} from "@/components/smartrotom/AppLink";

export default async function SmartrotomHome() {
  return (
    <main className="w-full bg-wingull bg-center bg-no-repeat bg-cover bg-fixed flex flex-col"
      style={{ backgroundImage: "url('/smartrotom/img/wingull.avif')" }}
    >
      <Hora className="p-5 text-white text-7xl lg:text-8xl col-span-6 text-center text-shadow-gray-border3" />
          <AppList />
    </main>
  );
}
