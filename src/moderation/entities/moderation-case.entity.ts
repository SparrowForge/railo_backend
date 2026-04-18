import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ModerationCaseStatusEnum } from '../enums/moderation-case-status.enum';
import { ModerationTargetTypeEnum } from '../enums/moderation-target-type.enum';
import { ModerationAction } from './moderation-action.entity';

@Entity('rillo_moderation_cases')
@Unique(['targetType', 'targetId'])
@Index(['status', 'lastReportedAt'])
export class ModerationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ModerationTargetTypeEnum })
  targetType: ModerationTargetTypeEnum;

  @Column({ type: 'uuid' })
  targetId: string;

  @Column({ type: 'enum', enum: ModerationCaseStatusEnum, default: ModerationCaseStatusEnum.open })
  status: ModerationCaseStatusEnum;

  @Column({ type: 'int', default: 0 })
  reportCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastReportedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ModerationAction, (action) => action.case)
  actions: ModerationAction[];
}

