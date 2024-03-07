import { SmartrotomUser } from "src/smartrotom/users/entities/user.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity({name: 'wingull_invites'})
export class Invite {
    @PrimaryColumn()
    id: string;

    @Column()
    @Unique(['uuid'])
    @JoinColumn({ name: 'uuid' })
    @OneToOne(() => SmartrotomUser)
    uuid: string;

    @Column()
    @Unique(['username'])
    username: string;
    
    @CreateDateColumn()
    createdAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column({nullable: true})
    usedAt: Date;
    
    
}
