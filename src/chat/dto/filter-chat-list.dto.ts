import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { chat_request_status } from 'src/common/enums/chat-request.enum';

export class FilterChatDto extends PaginationDto {
  @ApiProperty({ description: 'User Guid Id', example: 'xxxx-xxxx-xxxx-xxxx', required: true })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Filter chat list by request status',
    enum: [chat_request_status.pending, chat_request_status.accepted],
    example: chat_request_status.pending,
  })
  @IsOptional()
  @IsIn([chat_request_status.pending, chat_request_status.accepted])
  request_status?: chat_request_status;

  // @ApiProperty({ description: 'last updated_at', example: 'xxxx-xxxx-xxxx-xxxx', required: false })
  // @IsDateString()
  // @IsOptional()
  // updated_at?: string // ISO timestamp
}
