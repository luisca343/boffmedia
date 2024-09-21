"use client";
import { useBoffSession } from "@/services/useBoffSession";

export default function SessionTest() {
  const { session } = useBoffSession();
  return (
    <div>
      <h1>Session Test</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
