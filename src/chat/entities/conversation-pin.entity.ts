import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Conversation } from "src/conversation/entities/conversation.entity";

@Entity('rillo_conversation_pins')
@Unique(['conversation_id', 'user_id'])
export class ConversationPin {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @CreateDateColumn()
    created_at: Date;
}
