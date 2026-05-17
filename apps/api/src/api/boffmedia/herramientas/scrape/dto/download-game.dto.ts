import { IsUrl } from 'class-validator';

export class DownloadGameDto {
  @IsUrl()
  url: string;
}
