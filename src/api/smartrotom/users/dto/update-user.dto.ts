import { PartialType } from '@nestjs/mapped-types';
import { CreateSmartrotomUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateSmartrotomUserDto) {}
