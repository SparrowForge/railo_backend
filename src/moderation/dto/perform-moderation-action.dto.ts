import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ModerationActionTypeEnum } from '../enums/moderation-action-type.enum';

export class PerformModerationActionDto {
  @ApiProperty({ enum: ModerationActionTypeEnum })
  @IsEnum(ModerationActionTypeEnum)
  actionType: ModerationActionTypeEnum;

  @ApiProperty({ required: false, example: 'Repeated spam and harassment.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

