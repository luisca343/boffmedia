export interface IBaseRepository<T, ID> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(data: Partial<T>): Promise<{ insertId: ID }>;
  update(id: ID, data: Partial<T>): Promise<void>;
  delete(id: ID): Promise<{ affectedRows: number }>;
  exists(id: ID): Promise<boolean>;
  findByIdOrThrow(id: ID, entityName: string): Promise<T>;
}