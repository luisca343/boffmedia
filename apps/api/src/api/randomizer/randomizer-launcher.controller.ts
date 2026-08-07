import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { Readable } from 'stream';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  LauncherAuthGuard,
  LauncherRequest,
} from '@api/packs/guards/launcher-auth.guard';
import { AssignmentsService } from './services/assignments.service';
import { AssignmentClaimedDto } from './dto/randomizer.dto';

// Launcher endpoints for randomizer claim and ROM patching.
// All routes require launcher authentication.
@ApiTags('Randomizer | Launcher')
@Controller('randomizer/launcher')
@UseGuards(LauncherAuthGuard)
@ApiBearerAuth('Launcher')
export class RandomizerLauncherController {
  constructor(private readonly assignments: AssignmentsService) {}

  /**
   * GET /events/:eventId/assignment
   *
   * Get the current launcher user's assignment for an event.
   * Returns sealed DTO (no seed, no log, status only).
   * On first call, binds the launcher's UUID and marks as claimed.
   */
  @Get('events/:eventId/assignment')
  @ApiOperation({ summary: 'Obtener mi asignación en un evento' })
  @ApiResponse({ status: 200, type: AssignmentClaimedDto })
  async getMyAssignment(
    @Param('eventId') eventId: string,
    @Req() req: LauncherRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    return this.assignments.getMyAssignment(Number(eventId), req.launcher);
  }

  /**
   * POST /events/:eventId/rom
   *
   * Upload a patched ROM: hash, verify, randomize, store log, return randomized ROM.
   * - Request body: multipart file (romFile)
   * - Response: streams the randomized ROM back
   *
   * In the handler, extract romFile from req.file or multipart stream.
   */
  @Post('events/:eventId/rom')
  @ApiOperation({
    summary: 'Subir ROM parcheada y descargar ROM aleatorizada',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: 'application/octet-stream' })
  async patchRom(
    @Param('eventId') eventId: string,
    @Req() req: LauncherRequest,
  ): Promise<StreamableFile> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    // TODO: Extract ROM file from multipart/form-data
    // For Phase 0, pass stub stream to trigger runner (which will throw 503)
    const stubStream = Readable.from(Buffer.alloc(0));

    const { randomizedRom } = await this.assignments.patchRom(
      Number(eventId),
      req.launcher,
      stubStream,
    );

    // Return randomized ROM as file download
    return new StreamableFile(randomizedRom, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="randomized.gba"',
    });
  }
}
