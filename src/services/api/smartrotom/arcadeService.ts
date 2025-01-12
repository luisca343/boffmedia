import { rotomGET } from '@/services/boffAPI';

export const arcadeService = {
  getInfo: () => rotomGET('/arcade'),
  getWordle: (uuid: string) => rotomGET(`/arcade/wordle/${uuid}`)
};

