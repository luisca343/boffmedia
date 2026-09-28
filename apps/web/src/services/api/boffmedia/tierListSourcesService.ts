import { apiUpload } from "@/services/boffAPI"
import { staticAssetUrl } from "@/lib/assets"
import { EventsService } from "./eventsService"
import type { TierListSourceRegistry } from "@/features/tier-list/adapters/sources"
import type { TierListImageStorageAdapter } from "@/features/tier-list/adapters/images"

const imageUrl = (url: string) => url.startsWith("/") ? staticAssetUrl(url) : url

/** Adapts existing entities by reference. Core types contain no game-specific fields. */
export const tierListSources: TierListSourceRegistry = {
  "site-games": async (_params, signal) => {
    signal?.throwIfAborted()
    const response = await EventsService.getGames()
    signal?.throwIfAborted()
    if (!response.success || !response.data) throw new Error("Could not load game collection")
    return response.data.map((game) => ({
      id: `game-${game.id}`, name: game.title, description: game.description,
      image: game.icon ? imageUrl(game.icon) : undefined,
      entity: { source: "site-games", id: String(game.id) },
    }))
  },
}

/** Uses the existing guarded upload endpoint and ownership registry. Images are public URLs. */
export const tierListImageStorage: TierListImageStorageAdapter = {
  async upload(file) {
    const response = await apiUpload(file, { path: "tier-lists" })
    if (response.statusCode >= 400 || !response.data?.url) throw new Error("Image upload failed")
    return imageUrl(response.data.url)
  },
}
