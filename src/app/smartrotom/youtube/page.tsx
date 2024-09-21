"use client";
import YoutubeResults from "./_components/YoutubeResults";
import { useBoffSession } from "@/services/useBoffSession";

export default function Youtube() {
  const { session } = useBoffSession();
  console.log(session);
  return <YoutubeResults />;
}
