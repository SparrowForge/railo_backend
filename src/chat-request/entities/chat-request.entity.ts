import { User } from "../../users/entities/user.entity";
import { chat_request_status } from "./../../common/enums/chat-request.enum";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn } from "typeorm";

@Entity('rillo_chat_requests')
@Unique(['sender_id', 'receiver_id'])
export class ChatRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    sender_id: string;

    @Column({ type: 'uuid' })
    receiver_id: string;

    @Column({ type: 'enum', enum: chat_request_status, default: chat_request_status.pending, })
    status: chat_request_status;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    /*Relations */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'sender_id' })
    sender_user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'receiver_id' })
    receiver_user: User;
}

