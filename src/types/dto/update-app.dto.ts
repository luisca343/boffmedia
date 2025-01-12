import { CreateAppDto } from './create-app.dto';

export type UpdateAppDto = Partial<CreateAppDto> & {
  name?: string;
  description?: string;
  url?: string;
  icon?: string;
};