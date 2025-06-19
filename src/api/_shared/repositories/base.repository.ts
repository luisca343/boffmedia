import { IBaseRepository } from './base.repository.interface';
import { EntityNotFoundException } from '../exceptions/entity-not-found.exception';
import { DatabaseRepository } from './database.repository';

export abstract class BaseRepository<T, ID> extends DatabaseRepository implements IBaseRepository<T, ID> {
  abstract findAll(): Promise<T[]>;
  abstract findById(id: ID): Promise<T | null>;
  abstract create(data: Partial<T>): Promise<{ insertId: ID }>;
  abstract update(id: ID, data: Partial<T>): Promise<void>;
  abstract delete(id: ID): Promise<{ affectedRows: number }>;

  async exists(id: ID): Promise<boolean> {
    const entity = await this.findById(id);
    return !!entity;
  }

  async findByIdOrThrow(id: ID, entityName: string): Promise<T> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new EntityNotFoundException(entityName, String(id));
    }
    return entity;
  }
}