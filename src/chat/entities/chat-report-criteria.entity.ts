import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { ChatReport } from "./chat-report.entity";
import { ChatReportCriteriaEnum } from "../dto/chat-report-criteria.enum";

@Entity('rillo_chat_report_criteria')
@Unique(['reportId', 'criteria'])
export class ChatReportCriteria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    reportId: string;

    @Column({ type: 'enum', enum: ChatReportCriteriaEnum })
    criteria: ChatReportCriteriaEnum;

    @ManyToOne(() => ChatReport, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reportId' })
    report: ChatReport;
}
