
import SessionTest from "@/components/SessionTest";
import { GlobalProviders } from "./GlobalProviders";
export default function Home() {
  return (
    <GlobalProviders >
        <div className="flex h-full items-center justify-center bg-main-100">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-main-800">Página en construcción</h1>
          <p className="mt-4 text-lg text-main-600">Esta página está en construcción, por favor regrese más tarde.</p>
        </div>
      </div>
    </GlobalProviders>
  );
}
