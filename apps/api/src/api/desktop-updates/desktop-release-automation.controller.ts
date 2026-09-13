import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '@api/_utils/decorators/public.decorator';
import { ReleaseDeploymentGuard } from '@api/boffmedia/releases/release-deployment.guard';
import { DesktopUpdatesService } from './desktop-updates.service';
import { DesktopAutomationReleaseQueryDto } from './dto/desktop-updates.dto';
import { DesktopReleaseEntity } from './entities/desktop-updates.entity';

/**
 * CI-only artifact path. Human-admin publishing remains behind StepUpGuard;
 * release automation uses the separate internal deployment credential because
 * a five-minute TOTP step-up cannot safely be minted before a twenty-minute
 * Windows build completes.
 */
@ApiTags('Desktop | Release Automation')
@Controller('desktop/updates/internal')
@Public()
@UseGuards(ReleaseDeploymentGuard)
export class DesktopReleaseAutomationController {
  constructor(private readonly updates: DesktopUpdatesService) {}

  @Post('artifacts')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('application/octet-stream')
  @ApiHeader({
    name: 'X-Release-Deployment-Token',
    required: true,
    description: 'Credential used by trusted release automation',
  })
  @ApiHeader({
    name: 'X-Updater-Signature',
    required: true,
    description: 'Signature generated for the updater artifact',
  })
  @ApiHeader({
    name: 'X-Artifact-Filename',
    required: true,
    description: 'Original artifact filename',
  })
  @ApiOperation({
    summary: 'Upload a desktop artifact from release automation',
    description:
      'The raw artifact is stored as a draft. Set publish=true only for a verified production updater release; the public product changelog still follows the product-release readiness gate.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: DesktopReleaseEntity })
  async upload(
    @Query() query: DesktopAutomationReleaseQueryDto,
    @Headers('x-updater-signature') signature: string,
    @Headers('x-artifact-filename') filename: string,
    @Req() req: Request,
  ): Promise<DesktopReleaseEntity> {
    const draft = await this.updates.publishArtifact(
      req,
      {
        version: query.version,
        target: query.target,
        signature: signature ?? '',
        notes: query.notes ?? null,
        filename: filename ?? '',
      },
      null,
    );

    return query.publish === 'true'
      ? this.updates.setPublished(draft.id, true)
      : draft;
  }
}
