import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ProductVersionService } from './product-version.service';
import { ApiVersionEntity } from './version.entity';

@ApiTags('System | Version')
@Controller()
export class VersionController {
  constructor(private readonly productVersion: ProductVersionService) {}

  @Get('version')
  @Public()
  @ApiOperation({ summary: 'API build identity' })
  @ApiResponse({ status: 200, type: ApiVersionEntity })
  getVersion(): ApiVersionEntity {
    const identity = this.productVersion.getIdentity();
    return { surface: 'api', ...identity };
  }
}
