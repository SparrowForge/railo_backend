import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { User } from "src/users/entities/user.entity";
import { ChatReportCriteria } from "./chat-report-criteria.entity";

@Entity('rillo_chat_reports')
@Unique(['loggedInUserId', 'targetUserId'])
export class ChatReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    loggedInUserId: string;

    @Column({ type: 'uuid' })
    targetUserId: string;

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

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    targetUser: User;
}
