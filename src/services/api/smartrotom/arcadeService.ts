import { rotomGET, ApiResponse } from '@/services/boffAPI';

export type ArcadeInfoResponse = any; // Replace 'any' with the actual type when available
export type WordleResponse = any; // Replace 'any' with the actual type when available

export const arcadeService = {
  getInfo: () => rotomGET<ArcadeInfoResponse>('/arcade'),
  getWordle: (uuid: string) => rotomGET<WordleResponse>(`/arcade/wordle/${uuid}`)
};

