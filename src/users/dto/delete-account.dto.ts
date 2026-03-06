import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { DeleteAccount } from '../entities/delete-account.entity';

export class DeleteAccountDto extends PartialType(DeleteAccount) {
  @ApiProperty({ description: 'Irrelevant Content', example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_irrelevant_content: boolean;

  @ApiProperty({ description: 'Negative Community', example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_negative_community: boolean;

  @ApiProperty({ description: 'No Activity', example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_no_activity: boolean;

  @ApiProperty({ description: 'Too time consuming', example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_too_time_consuming: boolean;

  @ApiProperty({ description: 'Other', example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_other: boolean;
}
