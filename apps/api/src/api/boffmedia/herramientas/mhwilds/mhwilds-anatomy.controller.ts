import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { MhwildsAnatomyService } from './services/mhwilds-anatomy.service';
import { AnatomyOverrideEntity } from './entities/anatomy-overrides.entity';

/** Public runtime feed. The values are corrections, not private admin data. */
@ApiTags('BoffMedia | MH Wilds')
@Public()
@Controller('tools/mhwilds')
export class MhwildsAnatomyController {
  constructor(private readonly anatomy: MhwildsAnatomyService) {}

  @Get('anatomy-overrides')
  @ApiOperation({
    summary: "Get published Hunter's Manual callout corrections",
  })
  @ApiResponse({ status: HttpStatus.OK, type: [AnatomyOverrideEntity] })
  async list(): Promise<AnatomyOverrideEntity[]> {
    return this.anatomy.list();
  }
}
