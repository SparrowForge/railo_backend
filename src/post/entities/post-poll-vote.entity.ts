import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Posts } from "./post.entity";
import { PostPollOption } from "./post-poll-options.entity";
import { User } from "src/users/entities/user.entity";

@Entity('rillo_post_poll_votes')
@Unique(['postId', 'userId'])
export class PostPollVote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    postId: string;

    @Column({ type: 'uuid' })
    postPollOptionId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Posts;

    @ManyToOne(() => PostPollOption, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postPollOptionId' })
    pollOption: PostPollOption;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
