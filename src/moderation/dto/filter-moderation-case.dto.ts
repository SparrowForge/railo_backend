import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ModerationCaseStatusEnum } from '../enums/moderation-case-status.enum';
import { ModerationTargetTypeEnum } from '../enums/moderation-target-type.enum';

export class FilterModerationCaseDto extends PaginationDto {
  @ApiProperty({ required: false, enum: ModerationCaseStatusEnum })
  @IsEnum(ModerationCaseStatusEnum)
  @IsOptional()
  status?: ModerationCaseStatusEnum;

  @ApiProperty({ required: false, enum: ModerationTargetTypeEnum })
  @IsEnum(ModerationTargetTypeEnum)
  @IsOptional()
  targetType?: ModerationTargetTypeEnum;
}
