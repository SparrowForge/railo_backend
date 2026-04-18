import { ApiProperty } from "@nestjs/swagger";
import { conversation_type } from "src/common/enums/conversation-type.enum";
import { User } from "src/users/entities/user.entity";
import { ConversationParticipant } from "./conversation-participant.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Files } from "../../files/entities/file.entity";

@Entity('rillo_conversation')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: true })
    user_one_id: string;

    @Column({ type: 'uuid', nullable: true })
    user_two_id: string;

    @Column({
        type: 'enum',
        enum: conversation_type,
        default: conversation_type.direct,
    })
    type: conversation_type;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    image_id: number;

    @Column({ type: 'uuid', nullable: true })
    created_by: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    is_chat_request_accepted: boolean;

    @Column({ type: 'boolean', default: false })
    is_moderation_locked: boolean;

    @Column({ type: 'uuid', nullable: true })
    moderation_locked_by: string | null;

    @Column({ type: 'timestamp', nullable: true })
    moderation_locked_at: Date | null;

    @Column({ type: 'text', nullable: true })
    moderation_lock_reason: string | null;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    /* Relation */
    @ApiProperty({ description: 'User object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_one_id' })
    user_one: User;

    @ApiProperty({ description: 'File object', type: () => Files, })
    @ManyToOne(() => Files, { nullable: true })
    @JoinColumn({ name: 'image_id' })
    image: Files;


    @ApiProperty({ description: 'User object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_two_id' })
    user_two: User;

    @OneToMany(
        () => ConversationParticipant,
        (participant) => participant.conversation,
    )
    participants: ConversationParticipant[];

}
