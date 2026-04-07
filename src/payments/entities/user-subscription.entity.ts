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
import { SubscriptionPackage } from '../../subscription-package/entities/subscription-package.entity';
import { UserSubscriptionStatus } from '../enums/user-subscription-status.enum';
import { SubscriptionPayment } from './subscription-payment.entity';

@Entity('rillo_user_subscriptions')
export class UserSubscription {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  subscription_package_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  subscription_payment_id: string;

  @ApiProperty({ enum: UserSubscriptionStatus })
  @Column({
    type: 'enum',
    enum: UserSubscriptionStatus,
    default: UserSubscriptionStatus.active,
  })
  status: UserSubscriptionStatus;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  starts_at: Date;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  ends_at: Date;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty()
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => SubscriptionPackage, { nullable: false })
  @JoinColumn({ name: 'subscription_package_id' })
  subscription_package: SubscriptionPackage;

  @ManyToOne(() => SubscriptionPayment, { nullable: false })
  @JoinColumn({ name: 'subscription_payment_id' })
  subscription_payment: SubscriptionPayment;
}
