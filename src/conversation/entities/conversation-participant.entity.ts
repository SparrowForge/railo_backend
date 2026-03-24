import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('rillo_conversation_participant')
@Unique(['conversation_id', 'user_id'])
export class ConversationParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ default: false })
    is_admin: boolean;

    @CreateDateColumn()
    joined_at: Date;

    @ApiProperty({ description: 'Conversation object', type: () => Conversation })
    @ManyToOne(() => Conversation, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ApiProperty({ description: 'User object', type: () => User })
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
