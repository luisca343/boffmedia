import { rotomGET } from '@/services/boffAPI';

export const rotomArcadeService = {
  getInfo: () => rotomGET('/arcade'),
  getWordle: (uuid: string) => rotomGET(`/arcade/wordle/${uuid}`)
};

