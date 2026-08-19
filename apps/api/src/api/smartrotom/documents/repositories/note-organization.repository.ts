import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, asc, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomNoteFolders,
  rotomNoteTags,
  rotomNoteTagLinks,
  rotomNoteVersions,
} from '@/_db/schema/SmartRotomDocuments';
import {
  INoteOrganizationRepository,
  FolderRow,
  TagRow,
  TagLink,
  VersionRow,
} from './interfaces/note-organization.repository.interface';

@Injectable()
export class NoteOrganizationRepository implements INoteOrganizationRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== FOLDERS ====================
  async findFoldersByUser(uuid: string): Promise<FolderRow[]> {
    return this.db
      .select({
        id: rotomNoteFolders.id,
        name: rotomNoteFolders.name,
        color: rotomNoteFolders.color,
        parentId: rotomNoteFolders.parentId,
        createdAt: rotomNoteFolders.createdAt,
        updatedAt: rotomNoteFolders.updatedAt,
      })
      .from(rotomNoteFolders)
      .where(eq(rotomNoteFolders.uuid, uuid))
      .orderBy(asc(rotomNoteFolders.name));
  }

  async findFolderById(id: number): Promise<FolderRow | null> {
    const rows = await this.db
      .select({
        id: rotomNoteFolders.id,
        name: rotomNoteFolders.name,
        color: rotomNoteFolders.color,
        parentId: rotomNoteFolders.parentId,
        createdAt: rotomNoteFolders.createdAt,
        updatedAt: rotomNoteFolders.updatedAt,
      })
      .from(rotomNoteFolders)
      .where(eq(rotomNoteFolders.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async createFolder(data: {
    uuid: string;
    name: string;
    color: string;
    parentId: number | null;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomNoteFolders).values({
      uuid: data.uuid,
      name: data.name,
      color: data.color,
      parentId: data.parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { insertId: result[0].insertId };
  }

  // Owner is part of the WHERE, not a pre-check: a folder id from another
  // player simply matches no row, so the query itself cannot cross owners.
  async updateFolder(
    id: number,
    ownerUuid: string,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<number> {
    const result = await this.db
      .update(rotomNoteFolders)
      .set(data)
      .where(
        and(eq(rotomNoteFolders.id, id), eq(rotomNoteFolders.uuid, ownerUuid)),
      );
    return result[0].affectedRows;
  }

  async deleteFolder(id: number, ownerUuid: string): Promise<number> {
    const result = await this.db
      .delete(rotomNoteFolders)
      .where(
        and(eq(rotomNoteFolders.id, id), eq(rotomNoteFolders.uuid, ownerUuid)),
      );
    return result[0].affectedRows;
  }

  // ==================== TAGS ====================
  async findTagsByUser(uuid: string): Promise<TagRow[]> {
    return this.db
      .select({
        id: rotomNoteTags.id,
        label: rotomNoteTags.label,
        color: rotomNoteTags.color,
      })
      .from(rotomNoteTags)
      .where(eq(rotomNoteTags.uuid, uuid))
      .orderBy(asc(rotomNoteTags.label));
  }

  async createTag(data: {
    uuid: string;
    label: string;
    color: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomNoteTags).values({
      uuid: data.uuid,
      label: data.label,
      color: data.color,
      createdAt: new Date(),
    });
    return { insertId: result[0].insertId };
  }

  async updateTag(
    id: number,
    ownerUuid: string,
    data: { label?: string; color?: string },
  ): Promise<number> {
    const result = await this.db
      .update(rotomNoteTags)
      .set(data)
      .where(and(eq(rotomNoteTags.id, id), eq(rotomNoteTags.uuid, ownerUuid)));
    return result[0].affectedRows;
  }

  async deleteTag(id: number, ownerUuid: string): Promise<number> {
    const result = await this.db
      .delete(rotomNoteTags)
      .where(and(eq(rotomNoteTags.id, id), eq(rotomNoteTags.uuid, ownerUuid)));
    return result[0].affectedRows;
  }

  // ==================== TAG LINKS ====================
  async findTagIdsByDocumentIds(ids: number[]): Promise<TagLink[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        documentId: rotomNoteTagLinks.documentId,
        tagId: rotomNoteTagLinks.tagId,
      })
      .from(rotomNoteTagLinks)
      .where(inArray(rotomNoteTagLinks.documentId, ids));
  }

  async findTagLink(
    documentId: number,
    tagId: number,
  ): Promise<TagLink | null> {
    const rows = await this.db
      .select({
        documentId: rotomNoteTagLinks.documentId,
        tagId: rotomNoteTagLinks.tagId,
      })
      .from(rotomNoteTagLinks)
      .where(
        and(
          eq(rotomNoteTagLinks.documentId, documentId),
          eq(rotomNoteTagLinks.tagId, tagId),
        ),
      )
      .limit(1);
    return rows[0] || null;
  }

  async addTagLink(documentId: number, tagId: number): Promise<void> {
    await this.db.insert(rotomNoteTagLinks).values({ documentId, tagId });
  }

  async removeTagLink(documentId: number, tagId: number): Promise<void> {
    await this.db
      .delete(rotomNoteTagLinks)
      .where(
        and(
          eq(rotomNoteTagLinks.documentId, documentId),
          eq(rotomNoteTagLinks.tagId, tagId),
        ),
      );
  }

  // ==================== VERSIONS ====================
  async findVersionsByDocument(documentId: number): Promise<VersionRow[]> {
    return this.db
      .select({
        id: rotomNoteVersions.id,
        documentId: rotomNoteVersions.documentId,
        label: rotomNoteVersions.label,
        content: rotomNoteVersions.content,
        authorUuid: rotomNoteVersions.authorUuid,
        words: rotomNoteVersions.words,
        createdAt: rotomNoteVersions.createdAt,
      })
      .from(rotomNoteVersions)
      .where(eq(rotomNoteVersions.documentId, documentId))
      .orderBy(desc(rotomNoteVersions.createdAt));
  }

  async findVersionById(id: number): Promise<VersionRow | null> {
    const rows = await this.db
      .select({
        id: rotomNoteVersions.id,
        documentId: rotomNoteVersions.documentId,
        label: rotomNoteVersions.label,
        content: rotomNoteVersions.content,
        authorUuid: rotomNoteVersions.authorUuid,
        words: rotomNoteVersions.words,
        createdAt: rotomNoteVersions.createdAt,
      })
      .from(rotomNoteVersions)
      .where(eq(rotomNoteVersions.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async createVersion(data: {
    documentId: number;
    label: string | null;
    content: string;
    authorUuid: string | null;
    words: number;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomNoteVersions).values({
      documentId: data.documentId,
      label: data.label,
      content: data.content,
      authorUuid: data.authorUuid,
      words: data.words,
      createdAt: new Date(),
    });
    return { insertId: result[0].insertId };
  }
}
