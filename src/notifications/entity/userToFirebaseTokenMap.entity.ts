import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('rillo_user_to_firebase_token_map')
export class UserToFirebaseTokenMap {
  @ApiProperty({ description: 'Table ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'User ID',
    example: 1,
    required: true,
  })
  @Column({ type: 'bigint', unsigned: true, nullable: false })
  @IsOptional()
  @IsUUID()
  userId: string;

  // Relationships
  @ApiProperty({ description: 'User details', type: () => User })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  users: User;

  @ApiProperty({
    description: 'User token',
    example:
      'cEZ7YYA56-ab1bgyu693Jh:APA91bE43nshE2E5zG-UaWmdVwv-SgqjWosKE6iyDoriepedWjCtAQ6utiQNRvxjEa41xF8EfCcrgb7ptC1Pk7Z2T4xl5V0COaybATtGxtNGI-eqzEOD4o8',
    required: true,
  })
  @Column({ length: 512, nullable: false })
  @IsOptional()
  token: string;

  @ApiProperty({
    description: 'User last active date & time',
    example: '2024-03-14T10:00:00.000Z',
  })
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  lastActiveAt: Date;
}
