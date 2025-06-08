export class CreateUserDto {
    username: string;
    email: string;
    password: string;
    mc_uuid?: string;

      constructor(createInviteDto: any, uuid: string) {
        this.email = createInviteDto.email;
        this.password = createInviteDto.password;
        this.username = createInviteDto.username;
        this.mc_uuid = uuid;
      }
}
