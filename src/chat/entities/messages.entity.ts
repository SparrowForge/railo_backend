import { Files } from "../../files/entities/file.entity";
import { message_status } from "./../../common/enums/message-status.enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity('rillo_message')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    conversation_id: string;

    @Column({ type: 'uuid' })
    sender_id: string;

    @Column({ type: 'text' })
    text: string;

    @Column({ type: 'uuid', nullable: true })
    reply_to_message_id?: string;

    @Column({ type: 'enum', enum: message_status, default: message_status.sent })
    status: message_status;

    @Column({ nullable: true })
    file_id: number;

    @CreateDateColumn()
    created_at: Date;

    /*Relations */
    @ManyToOne(() => Files, { nullable: true })
    @JoinColumn({ name: 'file_id' })
    file: Files;
}
