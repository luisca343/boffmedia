import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({name: 'boffmedia_users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    @Unique(['username'])
    username: string;

    @Column({ type: 'char', length: 36, nullable: true})
    @Unique(['mc_uuid'])
    mc_uuid: string;

    @Column()
    password: string;

    @Column()
    email: string;

}
