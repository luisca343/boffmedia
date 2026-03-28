import { rotomGET, ApiResponse } from "@/services/boffAPI"
import { Region } from "@boffmedia/shared"

export const regionService = {
  getRegions: () => rotomGET<Region[]>("/regions"),
}

