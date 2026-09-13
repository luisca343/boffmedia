import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import {
  CreateFragmentReleaseDto,
  RecordDeploymentDto,
} from './dto/releases.dto';
import {
  DeploymentResultEntity,
  ReleaseEntity,
  ReleaseFragmentRegistryEntity,
} from './entities/releases.entity';
import { ReleaseDeploymentGuard } from './release-deployment.guard';
import { ReleasesService } from './releases.service';

@ApiTags('BoffMedia | Release Deployments')
@Controller('releases/internal')
@Public()
@UseGuards(ReleaseDeploymentGuard)
export class ReleaseDeploymentController {
  constructor(private readonly service: ReleasesService) {}

  @Get('fragments/registered')
  @ApiHeader({
    name: 'X-Release-Deployment-Token',
    required: true,
    description: 'Service credential used by release preparation automation',
  })
  @ApiOperation({ summary: 'List fragments already claimed by releases' })
  @ApiResponse({ status: 200, type: ReleaseFragmentRegistryEntity })
  registeredFragments(): Promise<ReleaseFragmentRegistryEntity> {
    return this.service.registeredFragments();
  }

  @Post('drafts')
  @ApiHeader({
    name: 'X-Release-Deployment-Token',
    required: true,
    description: 'Service credential used by release preparation automation',
  })
  @ApiOperation({ summary: 'Create a fragment-backed release draft' })
  @ApiResponse({ status: 201, type: ReleaseEntity })
  createDraft(@Body() dto: CreateFragmentReleaseDto): Promise<ReleaseEntity> {
    return this.service.createFromFragments(dto);
  }

  @Post('deployments')
  @ApiHeader({
    name: 'X-Release-Deployment-Token',
    required: true,
    description:
      'Service credential used by verified production deployment workflows',
  })
  @ApiOperation({ summary: 'Record a verified deployment attempt' })
  @ApiResponse({ status: 201, type: DeploymentResultEntity })
  record(@Body() dto: RecordDeploymentDto): Promise<DeploymentResultEntity> {
    return this.service.recordDeployment(dto, 'deployment-automation');
  }
}
