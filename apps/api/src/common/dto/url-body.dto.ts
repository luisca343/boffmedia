import { IsUrl } from 'class-validator';

export class UrlBodyDto {
  @IsUrl()
  url: string;
}
