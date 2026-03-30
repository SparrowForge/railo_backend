import { Files } from 'src/files/entities/file.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Posts } from './post.entity';

@Entity('rillo_post_files')
@Unique(['postId', 'fileId'])
export class PostFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    postId: string;

    @Column({ type: 'integer' })
    fileId: number;

    @ManyToOne(() => Posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Posts;

    @ManyToOne(() => Files, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: Files;
}
