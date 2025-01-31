import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { App, OrderedApp } from '@/types/apps';
import { CreateAppDto } from '@/types/dto/create-app.dto';
import { OrderAppDto } from '@/types/dto/order-apps.dto';
import { UpdateAppDto } from '@/types/dto/update-app.dto';

export const appsService = {
  findAll: () => rotomGET<App[]>('/apps'),
  create: (createAppDto: CreateAppDto) => rotomPOST<App>('/apps', createAppDto),
  order: (orderAppDto: OrderAppDto) => rotomPOST<SuccessResponse>('/apps/order', orderAppDto),
  getForPlayer: (uuid: string) => rotomPOST<OrderedApp[]>('/apps/player', { uuid }),
  addAppToPlayer: (uuid: string, appId: number) => rotomPOST<SuccessResponse>('/apps/player/add', { uuid, appId }),
  removeAppFromPlayer: (uuid: string, appId: number) => rotomPOST<SuccessResponse>('/apps/player/remove', { uuid, appId }),
  findOne: (id: number) => rotomGET<App>(`/apps/${id}`),
  update: (id: number, updateAppDto: UpdateAppDto) => rotomPOST<App>(`/apps/${id}`, updateAppDto),
  remove: (id: number) => rotomPOST<SuccessResponse>(`/apps/${id}`, { method: 'DELETE' }),
};

