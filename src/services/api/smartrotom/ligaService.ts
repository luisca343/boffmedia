import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI'

export type ReplayResponse = any; // Replace 'any' with the actual type when available

export const ligaService = {
  getReplay: (id: number) => rotomGET<ReplayResponse>(`/liga/replay/${id}`),
};

