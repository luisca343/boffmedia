import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { AuditService } from '@api/_repositories/audit.service';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { BoffMediaAuditRow } from '@/_db/schema/BoffMediaEvents';

@Controller('boffmedia/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLES.BOFF_ADMIN, USER_ROLES.BOFF_ADMIN_CONTENT)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * List audit log entries for Boffmedia admin subjects.
   * Supports pagination and filtering by subject type and ID.
   */
  @Get('logs')
  async getLogs(
    @Query('limit', new ParseIntPipe()) limit: number = 50,
    @Query('offset', new ParseIntPipe()) offset: number = 0,
    @Query('subjectType') subjectType?: string,
    @Query('subjectId', new ParseIntPipe({ optional: true }))
    subjectId?: number,
  ): Promise<{ data: BoffMediaAuditRow[]; total: number }> {
    // Validate pagination
    if (limit < 1 || limit > 200) {
      throw new BadRequestException('limit must be between 1 and 200');
    }
    if (offset < 0) {
      throw new BadRequestException('offset must be >= 0');
    }

    return this.auditService.getLogs({
      limit,
      offset,
      subjectType,
      subjectId,
    });
  }

  /**
   * Get audit logs for a specific subject (e.g., a particular event or tournament).
   */
  @Get('subject/:subjectType/:subjectId')
  async getSubjectLogs(
    @Param('subjectType') subjectType: string,
    @Param('subjectId', new ParseIntPipe()) subjectId: number,
  ): Promise<BoffMediaAuditRow[]> {
    return this.auditService.getSubjectLogs(subjectType, subjectId);
  }
}
