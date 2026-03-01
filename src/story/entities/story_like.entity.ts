import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Unique,
    Index,
    JoinColumn,
} from 'typeorm';
import { Story } from './story.entity';

@Entity({ name: 'rillo_story_like' })
@Unique(['story_id', 'user_id'])
export class StoryLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    story_id: string;

    @Index()
    @Column({ type: 'uuid' })
    user_id: string;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne(() => Story, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'story_id' })
    story: Story;
}
