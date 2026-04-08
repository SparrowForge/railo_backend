import { ApiProperty } from '@nestjs/swagger';
import { BoostPackage } from 'src/boost-package/entities/boost-package.entity';
import { Posts } from 'src/post/entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rillo_boost_payment_records')
export class BoostPaymentRecord {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  boost_package_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  post_id: string;

  @ApiProperty({ required: false })
  @Column({ name: 'is_success', type: 'boolean', default: false })
  IsSuccess: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'message', type: 'varchar', length: 255, nullable: true })
  Message: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'validation_errors', type: 'jsonb', nullable: true })
  ValidationErrors: Record<string, unknown> | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_id', type: 'bigint', nullable: true })
  InvoiceId: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_status', type: 'varchar', length: 100, nullable: true })
  InvoiceStatus: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_reference', type: 'varchar', length: 255, nullable: true })
  InvoiceReference: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'customer_reference', type: 'varchar', length: 255, nullable: true })
  CustomerReference: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'provider_created_at', type: 'timestamp', nullable: true })
  CreatedDate: Date | null;

  @ApiProperty({ required: false })
  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  ExpiryDate: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'expiry_time', type: 'varchar', length: 50, nullable: true })
  ExpiryTime: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_value', type: 'float', nullable: true })
  InvoiceValue: number | null;

  @ApiProperty({ required: false })
  @Column({ name: 'comments', type: 'text', nullable: true })
  Comments: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'customer_name', type: 'varchar', length: 255, nullable: true })
  CustomerName: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'customer_mobile', type: 'varchar', length: 50, nullable: true })
  CustomerMobile: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'customer_email', type: 'varchar', length: 255, nullable: true })
  CustomerEmail: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'user_defined_field', type: 'varchar', length: 255, nullable: true })
  UserDefinedField: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_display_value', type: 'varchar', length: 100, nullable: true })
  InvoiceDisplayValue: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'due_deposit', type: 'float', nullable: true })
  DueDeposit: number | null;

  @ApiProperty({ required: false })
  @Column({ name: 'deposit_status', type: 'varchar', length: 100, nullable: true })
  DepositStatus: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_items', type: 'jsonb', nullable: true })
  InvoiceItems: Record<string, unknown>[] | null;

  @ApiProperty({ required: false })
  @Column({ name: 'invoice_transactions', type: 'jsonb', nullable: true })
  InvoiceTransactions: Record<string, unknown>[] | null;

  @ApiProperty({ required: false })
  @Column({ name: 'suppliers', type: 'jsonb', nullable: true })
  Suppliers: Record<string, unknown>[] | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BoostPackage, { nullable: false })
  @JoinColumn({ name: 'boost_package_id' })
  boost_package: BoostPackage;

  @ManyToOne(() => Posts, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Posts;
}
