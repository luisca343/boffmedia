import { Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({name: 'smartrotom_apps'})
export class App {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Unique(['nombre'])
    name: string;

    @Column({nullable: true})
    description: string;

    @Column({nullable: true})
    url?: string;

    @Column({nullable: true})
    icon?: string;

    @Column({default: 999})
    order?: number;

    @DeleteDateColumn({nullable: true})
    deletedAt?: Date;
}
