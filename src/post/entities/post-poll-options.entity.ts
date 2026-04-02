import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Posts } from "./post.entity";
import { PollOptions } from "src/poll-options/entity/poll-options.entity";

@Entity('rillo_post_poll_options')
@Unique(['postId', 'pollOptionId'])
export class PostPollOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    postId: string;

    @Column({ type: 'uuid' })
    pollOptionId: string;

    @Column({ type: 'integer', default: 0 })
    pollCount: number;

    /*Relations */
    @ManyToOne(() => Posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Posts;

    @ManyToOne(() => PollOptions, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pollOptionId' })
    pollOption: PollOptions;
}
