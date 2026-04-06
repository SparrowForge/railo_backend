import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubscriptionPackageBenefit } from './subscription-package-benefit.entity';

@Entity('rillo_subscription_packages')
export class SubscriptionPackage {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Package price', example: 0 })
  @Column({ type: 'float', default: 0 })
  price: number;

  @ApiProperty({ description: 'Discounted percentage of package price', example: 0 })
  @Column({ type: 'float', default: 0, nullable: true })
  discountPercentage: number;

  @ApiProperty({ description: 'Discounted package price', example: 0 })
  @Column({ type: 'float', default: 0 })
  discountPrice: number;

  @ApiProperty({ description: 'Package duration', example: 0 })
  @Column({ type: 'int', default: 0 })
  duration: number;

  @ApiProperty({ description: 'Package type', example: 'popular/bestdeal' })
  @Column({ type: 'varchar', length: 100 })
  type: string;

  @ApiProperty({ description: 'Discounted package status', example: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Deleted at' })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  @ApiProperty({
    description: 'Package benefits',
    type: () => SubscriptionPackageBenefit,
    isArray: true,
  })
  @OneToMany(() => SubscriptionPackageBenefit, (benefit) => benefit.subscription_package, {
    cascade: true,
  })
  benifits: SubscriptionPackageBenefit[];
}
