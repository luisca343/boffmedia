import { IsBoolean } from 'class-validator';

export class SetBrowserTunnelDto {
  @IsBoolean()
  tunnelEnabled: boolean;
}
