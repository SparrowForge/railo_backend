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
import { SubscriptionPaymentStatus } from '../enums/subscription-payment-status.enum';

@Entity('rillo_subscription_payments')
export class SubscriptionPayment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  subscription_package_id: string;

  @ApiProperty({ enum: SubscriptionPaymentStatus })
  @Column({
    type: 'enum',
    enum: SubscriptionPaymentStatus,
    default: SubscriptionPaymentStatus.created,
  })
  status: SubscriptionPaymentStatus;

  @ApiProperty()
  @Column({ type: 'varchar', length: 50, default: 'myfatoorah' })
  provider: string;

  @ApiProperty()
  @Column({ type: 'float', default: 0 })
  amount: number;

  @ApiProperty()
  @Column({ type: 'varchar', length: 10, default: 'KWD' })
  currency: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  myfatoorah_invoice_id: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  myfatoorah_payment_id: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', length: 255, nullable: true })
  myfatoorah_invoice_reference: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  gateway_response: Record<string, unknown> | null;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  webhook_payload: Record<string, unknown> | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  paid_at: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  failed_at: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date | null;

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
}
