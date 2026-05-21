export interface IUserRepository {
  findUserByUuid(uuid: string): Promise<any | null>;
}
