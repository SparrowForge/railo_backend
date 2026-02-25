import { Entity, Unique, Index, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity('rillo_follows')
@Unique(['followerId', 'followingId'])
@Index(['followerId'])
@Index(['followingId'])
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Who is following
    @Column({ type: 'uuid' })
    followerId: string;

    // Who is being followed
    @Column({ type: 'uuid' })
    followingId: string;

    @CreateDateColumn()
    createdAt: Date;
}
