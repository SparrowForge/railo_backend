import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ModerationActionTypeEnum } from '../enums/moderation-action-type.enum';
import { ModerationCase } from './moderation-case.entity';

@Entity('rillo_moderation_actions')
export class ModerationAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  caseId: string;

  @Column({ type: 'uuid' })
  moderatorUserId: string;

  @Column({ type: 'enum', enum: ModerationActionTypeEnum })
  actionType: ModerationActionTypeEnum;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ModerationCase, (moderationCase) => moderationCase.actions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'caseId' })
  case: ModerationCase;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'moderatorUserId' })
  moderator: User;
}
