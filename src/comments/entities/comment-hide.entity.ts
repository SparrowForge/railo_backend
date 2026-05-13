import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Comments } from "./comment.entity";
import { User } from "src/users/entities/user.entity";

@Entity('rillo_comment_hide')
@Unique(['commentId', 'userId'])
export class CommentHide {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    commentId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'commentId' })
    comment: Comments;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
