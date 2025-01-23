import { AppList } from "@/components/smartrotom/AppList";
import ClickableClock from "@/components/smartrotom/ClickableClock";

export default function SmartrotomHome() {
  return (
    <main
      className="w-full min-h-screen bg-wingull bg-center bg-no-repeat bg-cover bg-fixed flex flex-col"
      style={{ backgroundImage: "url('/smartrotom/img/wingull.avif')" }}
    >
      <div className="flex flex-col items-center p-5 space-y-4">
        <ClickableClock />
      </div>
      <AppList />
    </main>
  );
}