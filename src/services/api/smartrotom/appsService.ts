import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { CreateAppDto } from '@/types/dto/create-app.dto';
import { OrderAppDto } from '@/types/dto/order-apps.dto';
import { UpdateAppDto } from '@/types/dto/update-app.dto';

export const appsService = {
  findAll: () => rotomGET('/apps'),
  create: (createAppDto: CreateAppDto) => rotomPOST('/apps', createAppDto),
  order: (orderAppDto: OrderAppDto) => rotomPOST('/apps/order', orderAppDto),
  getForPlayer: (uuid: string) => rotomPOST('/apps/player', { uuid }),
  findOne: (id: number) => rotomGET(`/apps/${id}`),
  update: (id: number, updateAppDto: UpdateAppDto) => rotomPOST(`/apps/${id}`, updateAppDto),
  remove: (id: number) => rotomPOST(`/apps/${id}`, { method: 'DELETE' }),
};

