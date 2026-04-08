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
import { BoostPaymentRecord } from './boost-payment-record.entity';
import { PostBoostStatus } from '../enums/post-boost-status.enum';

@Entity('rillo_post_boosts')
export class PostBoost {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  user_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  post_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  boost_package_id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  boost_payment_record_id: string;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  boost_quantity: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  boost_minutes: number;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  starts_at: Date;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  ends_at: Date;

  @ApiProperty({ enum: PostBoostStatus })
  @Column({
    type: 'enum',
    enum: PostBoostStatus,
    default: PostBoostStatus.active,
  })
  status: PostBoostStatus;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Posts, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post: Posts;

  @ManyToOne(() => BoostPackage, { nullable: false })
  @JoinColumn({ name: 'boost_package_id' })
  boost_package: BoostPackage;

  @ManyToOne(() => BoostPaymentRecord, { nullable: false })
  @JoinColumn({ name: 'boost_payment_record_id' })
  boost_payment_record: BoostPaymentRecord;
}
