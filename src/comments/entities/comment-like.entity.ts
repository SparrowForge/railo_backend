import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Comments } from "./comment.entity";


@Entity('rillo_comment_likes')
@Unique(['commentId', 'userId'])
export class CommentLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    commentId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'commentId' })
    comment: Comments;

    @CreateDateColumn()
    createdAt: Date;
}
