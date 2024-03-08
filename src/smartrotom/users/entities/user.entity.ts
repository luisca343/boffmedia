import { Column, Entity, PrimaryColumn, Unique } from "typeorm";

@Entity({name: 'smartrotom_users'})
export class SmartrotomUser {
    @PrimaryColumn(('uuid'))
    uuid: string;

    @Column()
    @Unique(['username'])
    username: string;

    @Column({nullable: true})
    world: string;

}
