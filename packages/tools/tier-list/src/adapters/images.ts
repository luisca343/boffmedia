import { imageReferenceSchema } from "../core/schema"

export const TIER_LIST_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
export const TIER_LIST_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export interface TierListImageStorageAdapter { upload(file: File): Promise<string> }
export class TierListImageError extends Error {
  constructor(public readonly reason: "type" | "size" | "dimensions" | "invalid") { super(`Tier list image: ${reason}`) }
}
export function validateTierListImageFile(file: Pick<File, "type" | "size">) {
  if (!TIER_LIST_IMAGE_TYPES.some((type) => type === file.type)) throw new TierListImageError("type")
  if (!file.size || file.size > TIER_LIST_IMAGE_MAX_BYTES) throw new TierListImageError("size")
}
export async function uploadTierListImage(file: File, adapter: TierListImageStorageAdapter) {
  validateTierListImageFile(file)
  // The server also validates real content and dimensions; this boundary does not trust MIME alone.
  return imageReferenceSchema.parse(await adapter.upload(file))
}
