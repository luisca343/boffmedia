import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { AccountType } from '../enums/account-type.enum';
import { BaseDto } from '@api/_utils/dto/base.dto';

export class CreateAccountDto extends BaseDto {
  @ApiProperty({ description: 'UUID of the user' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Name of the account' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of the account',
    enum: AccountType,
    default: AccountType.SECONDARY,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType = AccountType.SECONDARY;

  @ApiProperty({
    description: 'Initial balance of the account in PokéDollars',
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  initialBalance?: number = 0;

  @ApiProperty({
    description: 'Image route/path for the account',
    required: false,
  })
  @IsOptional()
  @IsString()
  image?: string;
}
