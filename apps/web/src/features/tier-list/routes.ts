import type { TierListDocument } from "./core/schema"

export const tierListHref = (doc: TierListDocument, edit = false) => `/tier-lists/${doc.template.slug}${edit ? "/edit" : ""}?instance=${doc.instance.id}`
