import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('rillo_conversation_mute')
export class ConversationMute {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @Column({ type: 'timestamp', nullable: true })
    muted_until?: Date;
}
