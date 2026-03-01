import { Entity, PrimaryGeneratedColumn, Index, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from "typeorm";
import { StoryVisibilityEnum } from "./story_visibility.enum";
import { User } from "src/users/entities/user.entity";
import { Files } from "src/files/entities/file.entity";

@Entity({ name: 'rillo_story' })
export class Story {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'number' })
    file_id: number;

    @Column({ type: 'enum', enum: StoryVisibilityEnum, default: StoryVisibilityEnum.Public, })
    visibility: StoryVisibilityEnum;

    @Column({ type: 'timestamp' })
    expires_at: Date;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'int', default: 0 })
    view_count: number;

    @Column({ type: 'int', default: 0 })
    like_count: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    /* Relations */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Files, { nullable: true })
    @JoinColumn({ name: 'file_id' })
    file: Files;
}
