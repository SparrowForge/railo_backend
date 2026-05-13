import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { Comments } from "./comment.entity";
import { CommentReportCriteria } from "./comment-report-criteria.entity";

@Entity('rillo_comment_reports')
@Unique(['commentId', 'userId'])
export class CommentReport {
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

    @OneToMany(
        () => CommentReportCriteria,
        (_) => _.report,
    )
    criteriaRows: CommentReportCriteria[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
