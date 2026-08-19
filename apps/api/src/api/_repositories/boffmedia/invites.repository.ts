import { HttpException, Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { wingullInvites, Invite } from '@/_db/schema/Wingull';
import { eq, and, isNull, isNotNull, count } from 'drizzle-orm';
import { Logger } from 'nestjs-pino';

export interface CreateInviteData {
  id: string;
  uuid: string;
  username: string;
}

export interface UpdateInviteData {
  usedAt?: Date;
  deletedAt?: Date;
}

export interface InviteResult {
  id: string;
  uuid: string;
  username: string;
  createdAt: Date | null;
  usedAt: Date | null;
  deletedAt: Date | null;
}

@Injectable()
export class InvitesRepository {
  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  private readonly inviteSelect = {
    id: wingullInvites.id,
    uuid: wingullInvites.uuid,
    username: wingullInvites.username,
    createdAt: wingullInvites.createdAt,
    usedAt: wingullInvites.usedAt,
    deletedAt: wingullInvites.deletedAt,
  };

  // ==================== CREATE OPERATIONS ====================

  async createInvite(
    data: CreateInviteData,
  ): Promise<{ success: boolean; invite?: InviteResult; message?: string }> {
    try {
      const result = await this.db
        .insert(wingullInvites)
        .values({
          id: data.id,
          uuid: data.uuid,
          username: data.username,
          createdAt: new Date(),
        } as Invite)
        .execute();

      if (result[0].affectedRows === 1) {
        const newInvite = await this.findInviteById(data.id);
        return {
          success: true,
          invite: newInvite || undefined,
        };
      }

      return {
        success: false,
        message: 'Failed to create invite',
      };
    } catch (error: any) {
      this.logger.error('Failed to create invite:', error);
      return {
        success: false,
        message: `Invite creation failed: ${error.message}`,
      };
    }
  }

  // ==================== READ OPERATIONS ====================

  async findAllInvites(
    _limit?: number,
    _offset?: number,
  ): Promise<InviteResult[]> {
    try {
      const query = this.db.select(this.inviteSelect).from(wingullInvites);
      return await query.execute();
    } catch (error: any) {
      this.logger.error('Failed to get all invites:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Invites retrieval failed: ${error.message}`);
    }
  }

  async findInviteById(id: string): Promise<InviteResult | null> {
    try {
      const result = await this.db
        .select(this.inviteSelect)
        .from(wingullInvites)
        .where(eq(wingullInvites.id, id))
        .execute();

      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find invite ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Invite lookup failed: ${error.message}`);
    }
  }

  async findActiveInviteById(id: string): Promise<InviteResult | null> {
    try {
      const result = await this.db
        .select(this.inviteSelect)
        .from(wingullInvites)
        .where(
          and(
            eq(wingullInvites.id, id),
            isNull(wingullInvites.usedAt),
            isNull(wingullInvites.deletedAt),
          ),
        )
        .execute();

      return result.length > 0 ? result[0] : null;
    } catch (error: any) {
      this.logger.error(`Failed to find active invite ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Active invite lookup failed: ${error.message}`);
    }
  }

  async findInvitesByUuid(uuid: string): Promise<InviteResult[]> {
    try {
      return await this.db
        .select(this.inviteSelect)
        .from(wingullInvites)
        .where(eq(wingullInvites.uuid, uuid))
        .execute();
    } catch (error: any) {
      this.logger.error(`Failed to find invites for UUID ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`UUID invites lookup failed: ${error.message}`);
    }
  }

  async findInvitesByUsername(username: string): Promise<InviteResult[]> {
    try {
      return await this.db
        .select(this.inviteSelect)
        .from(wingullInvites)
        .where(eq(wingullInvites.username, username))
        .execute();
    } catch (error: any) {
      this.logger.error(
        `Failed to find invites for username ${username}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Username invites lookup failed: ${error.message}`);
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  async updateInvite(
    id: string,
    updateData: UpdateInviteData,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.db
        .update(wingullInvites)
        .set(updateData as Invite)
        .where(eq(wingullInvites.id, id))
        .execute();

      if (result[0].affectedRows === 1) {
        return { success: true };
      }

      return {
        success: false,
        message: 'No invite found to update',
      };
    } catch (error: any) {
      this.logger.error(`Failed to update invite ${id}:`, error);
      return {
        success: false,
        message: `Invite update failed: ${error.message}`,
      };
    }
  }

  async markInviteAsUsed(
    id: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.updateInvite(id, { usedAt: new Date() });
    } catch (error: any) {
      this.logger.error(`Failed to mark invite ${id} as used:`, error);
      return {
        success: false,
        message: `Mark as used failed: ${error.message}`,
      };
    }
  }

  async markInviteAsDeleted(
    id: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      return await this.updateInvite(id, { deletedAt: new Date() });
    } catch (error: any) {
      this.logger.error(`Failed to mark invite ${id} as deleted:`, error);
      return {
        success: false,
        message: `Mark as deleted failed: ${error.message}`,
      };
    }
  }

  // ==================== DELETE OPERATIONS ====================

  async deleteInvite(
    id: string,
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.db
        .delete(wingullInvites)
        .where(eq(wingullInvites.id, id))
        .execute();

      if (result[0].affectedRows === 1) {
        return { success: true };
      }

      return {
        success: false,
        message: 'No invite found to delete',
      };
    } catch (error: any) {
      this.logger.error(`Failed to delete invite ${id}:`, error);
      return {
        success: false,
        message: `Invite deletion failed: ${error.message}`,
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  async checkInviteExists(id: string): Promise<boolean> {
    try {
      const invite = await this.findInviteById(id);
      return !!invite;
    } catch (error: any) {
      this.logger.error(`Failed to check invite existence ${id}:`, error);
      return false;
    }
  }

  async isInviteActive(id: string): Promise<boolean> {
    try {
      const invite = await this.findActiveInviteById(id);
      return !!invite;
    } catch (error: any) {
      this.logger.error(`Failed to check invite active status ${id}:`, error);
      return false;
    }
  }

  async getInviteCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(wingullInvites)
        .execute();

      return result[0].count;
    } catch (error: any) {
      this.logger.error('Failed to get invite count:', error);
      return 0;
    }
  }

  async getActiveInviteCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(wingullInvites)
        .where(
          and(isNull(wingullInvites.usedAt), isNull(wingullInvites.deletedAt)),
        )
        .execute();

      return result[0].count;
    } catch (error: any) {
      this.logger.error('Failed to get active invite count:', error);
      return 0;
    }
  }

  async getUsedInviteCount(): Promise<number> {
    try {
      const result = await this.db
        .select({ count: count() })
        .from(wingullInvites)
        .where(
          and(
            isNotNull(wingullInvites.usedAt),
            isNull(wingullInvites.deletedAt),
          ),
        )
        .execute();

      return result[0].count;
    } catch (error: any) {
      this.logger.error('Failed to get used invite count:', error);
      return 0;
    }
  }
}
