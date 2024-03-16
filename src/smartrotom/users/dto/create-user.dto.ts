export class CreateSmartrotomUserDto {
    uuid: string;
    username: string;
    world?: string;

    constructor(uuid: string, username: string) {
        this.uuid = uuid;
        this.username = username;
    }
}
