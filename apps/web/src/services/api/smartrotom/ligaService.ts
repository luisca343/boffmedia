import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI'

export type ReplayResponse = any; // Replace 'any' with the actual type when available

export class LigaService {
  /**
   * Get a replay by ID
   */
  static getReplay(id: number) {
    return rotomGET<ReplayResponse>(`/liga/replay/${id}`);
  }
}

