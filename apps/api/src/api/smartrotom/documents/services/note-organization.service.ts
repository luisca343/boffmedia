import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NOTE_ORGANIZATION_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';
import {
  INoteOrganizationRepository,
  FolderRow,
  TagRow,
  TagLink,
  VersionRow,
} from '../repositories/interfaces/note-organization.repository.interface';

const DEFAULT_COLOR = 'primary';

export interface CreateFolderRequest {
  uuid: string;
  name: string;
  color?: string;
  parentId?: number | null;
}

export interface CreateTagRequest {
  uuid: string;
  label: string;
  color?: string;
}

export interface CreateVersionRequest {
  documentId: number;
  content: string;
  label?: string | null;
  authorUuid?: string | null;
}

@Injectable()
export class NoteOrganizationService {
  constructor(
    @Inject(NOTE_ORGANIZATION_REPOSITORY_TOKEN)
    private readonly repo: INoteOrganizationRepository,
  ) {}

  // ==================== FOLDERS ====================
  getFolders(uuid: string): Promise<FolderRow[]> {
    return this.repo.findFoldersByUser(uuid);
  }

  async createFolder(req: CreateFolderRequest): Promise<FolderRow> {
    if (!req.name?.trim()) {
      throw new BadRequestException('El nombre de la carpeta es obligatorio');
    }
    const { insertId } = await this.repo.createFolder({
      uuid: req.uuid,
      name: req.name.trim(),
      color: req.color || DEFAULT_COLOR,
      parentId: req.parentId ?? null,
    });
    const folder = await this.repo.findFolderById(insertId);
    if (!folder) throw new NotFoundException('Carpeta no encontrada');
    return folder;
  }

  async updateFolder(
    id: number,
    ownerUuid: string,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<FolderRow> {
    if (id === data.parentId) {
      throw new BadRequestException(
        'Una carpeta no puede ser su propia carpeta padre',
      );
    }
    // The update is owner-scoped in SQL; 0 rows means the folder is not the
    // caller's (or does not exist), which is a 403 either way — telling the two
    // apart would leak that the id is real.
    const affected = await this.repo.updateFolder(id, ownerUuid, {
      ...data,
      name: data.name?.trim(),
    });
    if (affected === 0) {
      throw new ForbiddenException('Esta carpeta no te pertenece');
    }
    const folder = await this.repo.findFolderById(id);
    if (!folder) throw new NotFoundException('Carpeta no encontrada');
    return folder;
  }

  async deleteFolder(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean }> {
    const affected = await this.repo.deleteFolder(id, ownerUuid);
    if (affected === 0) {
      throw new ForbiddenException('Esta carpeta no te pertenece');
    }
    return { success: true };
  }

  // ==================== TAGS ====================
  getTags(uuid: string): Promise<TagRow[]> {
    return this.repo.findTagsByUser(uuid);
  }

  async createTag(req: CreateTagRequest): Promise<TagRow> {
    if (!req.label?.trim()) {
      throw new BadRequestException('La etiqueta necesita un nombre');
    }
    const { insertId } = await this.repo.createTag({
      uuid: req.uuid,
      label: req.label.trim(),
      color: req.color || DEFAULT_COLOR,
    });
    return {
      id: insertId,
      label: req.label.trim(),
      color: req.color || DEFAULT_COLOR,
    };
  }

  async updateTag(
    id: number,
    ownerUuid: string,
    data: { label?: string; color?: string },
  ): Promise<{ success: boolean }> {
    const affected = await this.repo.updateTag(id, ownerUuid, {
      ...data,
      label: data.label?.trim(),
    });
    if (affected === 0) {
      throw new ForbiddenException('Esta etiqueta no te pertenece');
    }
    return { success: true };
  }

  async deleteTag(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean }> {
    const affected = await this.repo.deleteTag(id, ownerUuid);
    if (affected === 0) {
      throw new ForbiddenException('Esta etiqueta no te pertenece');
    }
    return { success: true };
  }

  // ==================== TAG LINKS ====================
  async toggleTag(
    documentId: number,
    tagId: number,
  ): Promise<{ success: boolean; applied: boolean }> {
    const existing = await this.repo.findTagLink(documentId, tagId);
    if (existing) {
      await this.repo.removeTagLink(documentId, tagId);
      return { success: true, applied: false };
    }
    await this.repo.addTagLink(documentId, tagId);
    return { success: true, applied: true };
  }

  getTagLinksForDocuments(ids: number[]): Promise<TagLink[]> {
    return this.repo.findTagIdsByDocumentIds(ids);
  }

  // ==================== VERSIONS ====================
  getVersions(documentId: number): Promise<VersionRow[]> {
    if (!documentId || documentId <= 0) {
      throw new BadRequestException('Identificador de nota inválido');
    }
    return this.repo.findVersionsByDocument(documentId);
  }

  getVersion(id: number): Promise<VersionRow | null> {
    return this.repo.findVersionById(id);
  }

  async createVersion(req: CreateVersionRequest): Promise<VersionRow> {
    if (!req.documentId || req.documentId <= 0) {
      throw new BadRequestException('Identificador de nota inválido');
    }
    const { insertId } = await this.repo.createVersion({
      documentId: req.documentId,
      label: req.label ?? null,
      content: req.content,
      authorUuid: req.authorUuid ?? null,
      words: countWords(req.content),
    });
    const version = await this.repo.findVersionById(insertId);
    if (!version) throw new NotFoundException('Versión no encontrada');
    return version;
  }
}

// Strips HTML tags and counts whitespace-delimited words.
function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}
