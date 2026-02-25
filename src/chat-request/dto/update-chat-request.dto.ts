import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { chat_request_status } from 'src/common/enums/chat-request.enum';

export class UpdateChatRequestStatusDto {
    @ApiProperty({ description: 'chat request_id', example: '9a7c1b44-0a5e-4d3a-9f62-1c6a9f4b1234', })
    @IsUUID()
    request_id: string;

    @ApiProperty({ description: `chat request status: ${Object.values(chat_request_status).join(', ')}`, enum: chat_request_status, example: chat_request_status.accepted, })
    @IsEnum(chat_request_status, { message: `Invalid status: ${Object.values(chat_request_status).join(', ')}` })
    status: chat_request_status;
}