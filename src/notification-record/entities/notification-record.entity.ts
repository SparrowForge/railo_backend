import { ApiProperty } from '@nestjs/swagger';
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
import { NotificationDeliveryStatusType } from '../data/notification-delivery-status-type.data';

@Entity('rillo_notification_records')
export class NotificationRecord {

  @ApiProperty({ description: 'Workout type ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'user ID', example: 39 })
  @Column({ type: 'bigint', unsigned: true, nullable: true })
  userId?: string;

  @ApiProperty({ description: 'Notification Title', example: 'Some Title' })
  @Column({ unique: false, length: 255, nullable: false })
  notificationTitle: string;

  @ApiProperty({ description: 'Notification Message', example: 'Some message to send to the user.', })
  @Column({ unique: false, length: 255, nullable: false })
  notificationMessage: string;

  @ApiProperty({ description: 'Delivery Status', example: NotificationDeliveryStatusType.Pending, enum: NotificationDeliveryStatusType, })
  @Column({ type: 'enum', enum: NotificationDeliveryStatusType, nullable: true, default: NotificationDeliveryStatusType.Pending, })
  deliveryStatus?: NotificationDeliveryStatusType;

  @ApiProperty({ description: 'Is Seen', example: false })
  @Column({ type: 'boolean', nullable: true, default: false })
  isSeen: boolean;

  @ApiProperty({ description: 'Created at', example: '2024-03-14T12:00:00.000Z', })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-03-14T12:00:00.000Z', })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Deleted at', example: '2024-03-14T12:00:00.000Z', })
  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;

  // Relationships
  @ApiProperty({ description: 'Athlete details', type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  users: User;
}
