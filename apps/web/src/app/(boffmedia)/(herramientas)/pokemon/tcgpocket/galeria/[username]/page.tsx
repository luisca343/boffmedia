"use client";
import { PlayerGallery } from "../../_components/PlayerGallery";

export default function UserGallery({
  params,
}: {
  params: { username: string };
}) {
  return <PlayerGallery username={params.username} />;
}
