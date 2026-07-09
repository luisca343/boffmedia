import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicProfileService } from './public-profile.service';
import { PublicProfileEntity } from './entities/public-profile.entity';

@ApiTags('BoffMedia | Public Profile')
@Controller('profile')
export class PublicProfileController {
  constructor(private readonly service: PublicProfileService) {}

  @Get(':handle')
  @ApiOperation({ summary: 'Public profile by handle (username)' })
  @ApiParam({ name: 'handle', type: 'string', description: 'Username' })
  @ApiResponse({ status: 200, type: PublicProfileEntity })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getByHandle(@Param('handle') handle: string) {
    return this.service.getByHandle(handle);
  }
}
