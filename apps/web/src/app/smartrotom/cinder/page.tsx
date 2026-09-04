import { redirect } from "next/navigation";
import { isAppHidden } from "../_config/hidden-apps";

export default function Cinder() {
  // Hidden indefinitely — this stub app was never completed.
  if (isAppHidden("cinder")) {
    redirect("/smartrotom");
  }

  return (
    <div className="bg-layer-2 min-h-full overflow-auto p-4">
      <h1 className="text-white text-2xl font-bold">Cinder</h1>
    </div>
  );
}
