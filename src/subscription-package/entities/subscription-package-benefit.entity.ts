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
import { SubscriptionPackage } from './subscription-package.entity';

@Entity('rillo_subscription_package_benifits')
export class SubscriptionPackageBenefit {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Subscription package id',
    example: 'b7966a50-30b4-439c-a73a-46adee78e5c0',
  })
  @Column({ type: 'uuid' })
  subscription_package_id: string;

  @ApiProperty({ description: 'Benefit description', example: 'Unlimited support' })
  @Column({ type: 'text' })
  desc: string;

  @ApiProperty({ description: 'Created at' })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Deleted at' })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  @ManyToOne(() => SubscriptionPackage, (subscriptionPackage) => subscriptionPackage.benifits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'subscription_package_id' })
  subscription_package: SubscriptionPackage;
}
