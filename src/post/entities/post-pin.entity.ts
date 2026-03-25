import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { Posts } from "./post.entity";

@Entity('rillo_post_pins')
@Unique(['postId', 'userId'])
export class PostPin {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    postId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @ManyToOne(() => Posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Posts;

    @CreateDateColumn()
    createdAt: Date;
}
