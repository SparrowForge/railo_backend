import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { ChatReportCriteria } from "./chat-report-criteria.entity";
import { Conversation } from "src/conversation/entities/conversation.entity";

@Entity('rillo_chat_reports')
@Unique(['loggedInUserId', 'conversationId'])
export class ChatReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    loggedInUserId: string;

    @Column({ type: 'uuid' })
    conversationId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @OneToMany(
        () => ChatReportCriteria,
        (_) => _.report,
    )
    criteriaRows: ChatReportCriteria[];

    /*Relations */
    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'loggedInUserId' })
    loggedInUser: User;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;
}
