import type {
  ChangelogAdminItemEntity,
  CreateChangelogDto,
  UpdateChangelogDto,
} from "@boffmedia/shared"

import {
  apiAuthedAutoDELETE,
  apiAuthedAutoGET,
  apiAuthedAutoPATCH,
  apiAuthedAutoPOST,
} from "@/services/http/boff-client"

export type AdminChangelogProduct = "boffmedia" | "smartrotom" | "all"
export type AdminChangelogPlatform = "all" | "web" | "desktop"
export type AdminChangelogStatus = "draft" | "published" | "unpublished"

export const ChangelogAdminService = {
  list(filters?: {
    product?: AdminChangelogProduct
    platform?: AdminChangelogPlatform
    status?: AdminChangelogStatus
  }) {
    const query = new URLSearchParams()
    if (filters?.product) query.set("product", filters.product)
    if (filters?.platform) query.set("platform", filters.platform)
    if (filters?.status) query.set("status", filters.status)
    const suffix = query.size ? `?${query.toString()}` : ""
    return apiAuthedAutoGET<ChangelogAdminItemEntity[]>(`/changelogs/admin${suffix}`)
  },

  get(id: number) {
    return apiAuthedAutoGET<ChangelogAdminItemEntity>(`/changelogs/admin/${id}`)
  },

  create(input: CreateChangelogDto) {
    return apiAuthedAutoPOST<ChangelogAdminItemEntity>("/changelogs/admin", input)
  },

  update(id: number, input: UpdateChangelogDto) {
    return apiAuthedAutoPATCH<ChangelogAdminItemEntity>(`/changelogs/admin/${id}`, input)
  },

  publish(id: number) {
    return apiAuthedAutoPOST<ChangelogAdminItemEntity>(`/changelogs/admin/${id}/publish`, {})
  },

  unpublish(id: number) {
    return apiAuthedAutoPOST<ChangelogAdminItemEntity>(`/changelogs/admin/${id}/unpublish`, {})
  },

  remove(id: number) {
    return apiAuthedAutoDELETE<{ success: boolean }>(`/changelogs/admin/${id}`)
  },
}
