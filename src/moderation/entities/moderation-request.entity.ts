import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ModerationRequestStatusEnum } from '../enums/moderation-request-status.enum';

@Entity('rillo_moderation_requests')
export class ModerationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  requestedById: string;

  @Column({ type: 'enum', enum: ModerationRequestStatusEnum, default: ModerationRequestStatusEnum.pending })
  status: ModerationRequestStatusEnum;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;
}
