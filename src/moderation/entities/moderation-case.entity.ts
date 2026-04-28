import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ModerationCaseStatusEnum } from '../enums/moderation-case-status.enum';
import { ModerationTargetTypeEnum } from '../enums/moderation-target-type.enum';
import { ModerationAction } from './moderation-action.entity';
import { Posts } from 'src/post/entities/post.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Entity('rillo_moderation_cases')
@Unique(['targetType', 'postId','conversationId'])
@Index(['status', 'lastReportedAt'])
export class ModerationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ModerationTargetTypeEnum })
  targetType: ModerationTargetTypeEnum;

  @Column({ type: 'uuid', nullable: true })
  postId: string;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string;

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

  
  @ManyToOne(() => Posts, { nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Posts;

  @ManyToOne(() => Conversation, { nullable: true })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;
}

