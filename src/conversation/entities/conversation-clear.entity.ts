import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('rillo_conversation_clear')
export class ConversationClear {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'timestamp' })
    cleared_at: Date;
}
