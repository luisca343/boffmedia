import { rotomGET } from '@/services/boffAPI';

export const ligaService = {
  getReplay: (id: number) => rotomGET(`/liga/replay/${id}`)
};