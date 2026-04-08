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
import { BoostPackage } from './boost-package.entity';

@Entity('rillo_boost_package_benifits')
export class BoostPackageBenefit {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Boost package id',
    example: 'b7966a50-30b4-439c-a73a-46adee78e5c0',
  })
  @Column({ type: 'uuid' })
  boost_package_id: string;

  @ApiProperty({ description: 'Benefit description', example: 'Priority placement' })
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

  @ManyToOne(() => BoostPackage, (boostPackage) => boostPackage.benifits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'boost_package_id' })
  boost_package: BoostPackage;
}
