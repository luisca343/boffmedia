"use client"

import { useRouter } from "next/navigation"
import BoffLayout from "@/app/(boffmedia)/_components/BoffLayout"
import { Button } from "@/components/ui/button"
import { useBoffSession } from "@/services/useBoffSession"
import { useGalleryData } from "../_hooks/useGalleryData"
import { PlayerGallery } from "../../_components/PlayerGallery"

export default function UserGallery({ params }: { params: { username: string } }) {
  return (
    <BoffLayout>
      <PlayerGallery
        username={params.username}
      />
    </BoffLayout>
  )
}