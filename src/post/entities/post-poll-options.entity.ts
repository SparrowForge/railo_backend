import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Posts } from "./post.entity";

@Entity('rillo_post_poll_options')
@Unique(['postId', 'pollOption'])
export class PostPollOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    postId: string;

    @Column({ type: 'text', nullable: true })
    pollOption: string;

    @Column({ type: 'integer', default: 0 })
    pollCount: number;

    /*Relations */
    @ManyToOne(() => Posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Posts;
}
