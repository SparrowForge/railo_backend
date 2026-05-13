import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { CommentReportCriteriaEnum } from "../dto/comment-report-criteria.enum";
import { CommentReport } from "./comment-report.entity";

@Entity('rillo_comment_report_criteria')
@Unique(['reportId', 'criteria'])
export class CommentReportCriteria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    reportId: string;

    @Column({ type: 'enum', enum: CommentReportCriteriaEnum })
    criteria: CommentReportCriteriaEnum;

    @ManyToOne(() => CommentReport, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reportId' })
    report: CommentReport;
}
