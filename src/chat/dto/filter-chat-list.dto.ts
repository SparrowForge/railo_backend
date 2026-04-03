import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Search chats by group title, user name, display name, or username',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter chats by read status for the current user',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return undefined;
  })
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter chats by pinned status for the current user',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return undefined;
  })
  @IsBoolean()
  isPinned?: boolean;
}
