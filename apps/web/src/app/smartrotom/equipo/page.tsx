import { redirect } from "next/navigation";
import { isAppHidden } from "../_config/hidden-apps";

export default function Equipo() {
  // Hidden indefinitely — this stub app was never completed.
  if (isAppHidden("equipo")) {
    redirect("/smartrotom");
  }

  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">Equipo</h1>
    </div>
  );
}
