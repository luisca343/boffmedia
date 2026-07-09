import { PartialType } from '@nestjs/swagger';
import { CreateSmartrotomUserDto } from './create-user.dto';

export class UpdateSmartrotomUserDto extends PartialType(
  CreateSmartrotomUserDto,
) {}
