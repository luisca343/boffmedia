import { domToPng } from "../domToPng"

/** Capture the same presentation region users see, at 2x resolution. */
export async function exportTierListImage(presentation: HTMLElement): Promise<Blob> {
  if (presentation.querySelector('[data-drop-state="active"], [data-tier-insertion-preview]')) {
    throw new Error("Finish the movement before exporting")
  }
  return domToPng(presentation)
}
