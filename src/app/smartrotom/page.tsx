import { AppList } from "@/components/smartrotom/AppList";
import ClickableClock from "@/components/smartrotom/ClickableClock";

export default function SmartrotomHome() {
  return (
    <main
      className="w-full min-h-screen bg-wingull bg-center bg-no-repeat bg-cover bg-fixed relative"
      style={{ backgroundImage: "url('/smartrotom/img/wingull.avif')" }}
    >
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
        <ClickableClock />
      </div>
      <div className="pt-52 pb-4 w-full h-[100vh] overflow-auto">
        <AppList />
      </div>
    </main>
  );
}