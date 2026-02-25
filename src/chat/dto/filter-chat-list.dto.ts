import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterChatDto extends PaginationDto {
  @ApiProperty({ description: 'User Guid Id', example: 'xxxx-xxxx-xxxx-xxxx', required: true })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  // @ApiProperty({ description: 'last updated_at', example: 'xxxx-xxxx-xxxx-xxxx', required: false })
  // @IsDateString()
  // @IsOptional()
  // updated_at?: string // ISO timestamp
}
