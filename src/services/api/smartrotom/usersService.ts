import { rotomGET, rotomPOST, rotomPATCH, rotomDELETE, ApiResponse } from '@/services/boffAPI';
import { CreateSmartrotomUserDto } from '@/types/dto/create-user.dto';
import { UpdateUserDto } from '@/types/dto/update-user.dto';

export type User = any; // Replace 'any' with the actual User type
export type Account = any; // Replace 'any' with the actual Account type

export const usersService = {
  findAll: () => rotomGET<User[]>('/users'),
  create: (data: CreateSmartrotomUserDto) => rotomPOST<User>('/users', data),
  findUser: (data: CreateSmartrotomUserDto) => rotomPOST<User>('/users/findUser', data),
  initialize: (data: CreateSmartrotomUserDto) => rotomPOST<{ user: User, accounts: Account[] }>('/users/initialize', data),
  remove: (id: number) => rotomDELETE<any>(`/users/${id}`),
  update: (id: number, data: UpdateUserDto) => rotomPATCH<User>(`/users/${id}`, data),
  findOne: (uuid: string) => rotomGET<User>(`/users/${uuid}`),
};

