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

@Entity({ name: 'rillo_story_view' })
@Unique(['story_id', 'viewer_id'])
export class StoryView {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    story_id: string;

    @Index()
    @Column({ type: 'uuid' })
    viewer_id: string;

    @CreateDateColumn()
    viewed_at: Date;

    /* Relations */
    @ManyToOne(() => Story, { nullable: true })
    @JoinColumn({ name: 'story_id' })
    stories: Story;
}