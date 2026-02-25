import { User } from "src/users/entities/user.entity";
import { Entity, Index, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";

@Entity('rillo_comments')
@Index(['postId', 'createdAt'])
export class Comments {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'uuid' })
    postId: string;


    @Column({ type: 'uuid' })
    userId: string;

    // Parent comment for replies
    @Column({ type: 'uuid', nullable: true })
    parentId: string | null;

    @ManyToOne(() => Comments, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent: Comments | null;

    @OneToMany(() => Comments, (c) => c.parent)
    replies: Comments[];

    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: 0 })
    replyCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    /* Relation */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;
}
