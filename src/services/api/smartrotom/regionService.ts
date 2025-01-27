import { rotomGET, ApiResponse } from "@/services/boffAPI"
import { Region } from "@/types/region"

export const regionService = {
  getRegions: () => rotomGET<Region[]>("/smartrotom/regions"),
}

