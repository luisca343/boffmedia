import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository.interface';

export abstract class BaseRepositoryImpl<T, CreateDto, UpdateDto> 
  implements BaseRepository<T, CreateDto, UpdateDto> {
  
  constructor(
    protected readonly db: MySql2Database<Record<string, never>>,
    protected readonly table: any,
  ) {}

  async findAll(): Promise<T[]> {
    return await this.db.select().from(this.table) as T[];
  }

  async findById(id: number): Promise<T | null> {
    const result = await this.db.select()
      .from(this.table)
      .where(eq(this.table.id, id));
    return (result[0] as T) || null;
  }

  async exists(id: number): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  abstract create(data: CreateDto): Promise<T>;
  abstract update(id: number, data: UpdateDto): Promise<T>;
  abstract delete(id: number): Promise<boolean>;
}