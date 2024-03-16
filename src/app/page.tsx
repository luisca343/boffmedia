
import SessionTest from "@/components/SessionTest";
import { GlobalProviders } from "./GlobalProviders";
export default function Home() {
  return (
    <GlobalProviders >
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <SessionTest />
      </main>
    </GlobalProviders>
  );
}
