import { redirect } from "next/navigation";
import { isAppHidden } from "../_config/hidden-apps";

export default function Karts() {
  // Hidden pending build — backend API exists (POST /smartrotom/karts/carrera, GET /ranking, etc.)
  // but the front-end is scheduled for its own cycle. See APPS.md > Karts.
  if (isAppHidden("karts")) {
    redirect("/smartrotom");
  }

  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">Karts</h1>
    </div>
  );
}
