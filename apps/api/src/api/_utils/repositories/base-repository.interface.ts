export interface BaseRepository<T, CreateDto, UpdateDto> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: number, data: UpdateDto): Promise<T>;
  delete(id: number): Promise<boolean>;
  exists(id: number): Promise<boolean>;
}