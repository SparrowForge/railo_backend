import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('rillo_conversation_read')
export class ConversationRead {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'timestamp' })
    last_read_at: Date;
}
