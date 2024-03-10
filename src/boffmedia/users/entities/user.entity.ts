import { SmartrotomUser } from "../../../smartrotom/users/entities/user.entity"
import { Column, Entity, JoinColumn, ManyToMany, OneToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({name: 'boffmedia_users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    @Unique(['username'])
    username: string;

    @OneToOne(() => SmartrotomUser, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "mc_uuid", referencedColumnName: "uuid", })
    smartRotomUser: SmartrotomUser;

    @Column()
    password: string;

    @Column()
    email: string;

}
