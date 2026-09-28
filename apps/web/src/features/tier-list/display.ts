/** Presentation preferences never change placements, permissions or placement mode. */
export interface TierListDisplayOptions {
  title: boolean
  itemLabels: boolean
  rowLabels: boolean
  counts: boolean
  descriptions: boolean
  rowControls: boolean
}

export const defaultTierListDisplay: TierListDisplayOptions = {
  title: true, itemLabels: true, rowLabels: true, counts: false, descriptions: true, rowControls: true,
}
