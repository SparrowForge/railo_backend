import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('rillo_countries')
export class Country {
  @ApiProperty({
    description: 'Country ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Country name', example: 'Bangladesh' })
  @Column({ type: 'varchar', length: 255 })
  country_name: string;

  @ApiProperty({ description: 'Country code', example: 'BD' })
  @Column({ type: 'varchar', length: 10 })
  country_code: string;

  @ApiProperty({ description: 'Phone code', example: '+880' })
  @Column({ type: 'varchar', length: 20 })
  phone_code: string;

  @ApiProperty({
    description: 'Country deleted at',
    example: '2025-03-14T12:00:00.000Z',
  })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;
}
