import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicProfileService } from './public-profile.service';
import { PublicProfileEntity } from './entities/public-profile.entity';

@ApiTags('BoffMedia | Public Profile')
@Public()
@Controller('profile')
export class PublicProfileController {
  constructor(private readonly service: PublicProfileService) {}

  // ownership-ok: public by design - this IS the public profile. The service
  // exposes only public identity (never email, password or OAuth ids), excludes
  // soft-deleted accounts and nulls a hidden bio.
  @Get(':handle')
  @ApiOperation({ summary: 'Public profile by handle (username)' })
  @ApiParam({ name: 'handle', type: 'string', description: 'Username' })
  @ApiResponse({ status: 200, type: PublicProfileEntity })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getByHandle(@Param('handle') handle: string) {
    return this.service.getByHandle(handle);
  }
}
