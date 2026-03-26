import { Files } from "src/files/entities/file.entity";
import { PostTypeEnum } from "./../../common/enums/post-type.enum";
import { PostVisibilityEnum } from "./../../common/enums/post-visibility.enum";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { PostPollOption } from "./post-poll-options.entity";

@Entity('rillo_posts')
@Index(['userId', 'createdAt'])
export class Posts {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', nullable: true })
    text: string | null;

    @Column({ type: 'text', nullable: true })
    linkUrl: string | null;

    @Column({ type: 'enum', enum: PostTypeEnum, default: PostTypeEnum.regular, })
    postType: PostTypeEnum;

    @Column({ type: 'enum', enum: PostVisibilityEnum, default: PostVisibilityEnum.NORMAL, })
    visibility: PostVisibilityEnum;

    // Uploaded file reference (image/audio/video)
    @Column({ type: 'number', nullable: true })
    fileId: number;

    // Location selected by user
    @Column({ type: 'uuid', nullable: true })
    locationId: string | null;

    // Post owner
    @Column({ type: 'uuid' })
    userId: string;

    // Counters (important for performance)
    @Column({ default: 0 })
    likeCount: number;

    @Column({ default: 0 })
    commentCount: number;

    @Column({ default: 0 })
    shareCount: number;

    // If this post is a shared post
    @Column({ type: 'uuid', nullable: true })
    originalPostId: string | null;

    @ManyToOne(() => Posts, { nullable: true })
    @JoinColumn({ name: 'originalPostId' })
    originalPost: Posts | null;

    @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: true })
    location: string;

    @Column({ type: 'double precision', nullable: true })
    latitude: number;

    @Column({ type: 'double precision', nullable: true })
    longitude: number;


    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    /*Relations */
    @ManyToOne(() => Files, { nullable: true })
    @JoinColumn({ name: 'fileId' })
    file: Files;


    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;


    @OneToMany(
        () => PostPollOption,
        (_) => _.post,
    )
    pollOptions: PostPollOption[];
}
