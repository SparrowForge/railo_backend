import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { PostReport } from "./post-report.entity";
import { PostReportCriteriaEnum } from "../dto/post-report-criteria.enum";

@Entity('rillo_post_report_criteria')
@Unique(['reportId', 'criteria'])
export class PostReportCriteria {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    reportId: string;

    @Column({ type: 'enum', enum: PostReportCriteriaEnum })
    criteria: PostReportCriteriaEnum;

    @ManyToOne(() => PostReport, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reportId' })
    report: PostReport;
}
