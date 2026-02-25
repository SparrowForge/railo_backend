import { ApiProperty } from '@nestjs/swagger';
import { chat_request_status } from 'src/common/enums/chat-request.enum';

export class ChatRequestDto {
    @ApiProperty({
        example: '2c5f9a44-9e6b-4d9a-a6a5-3d9d2c7f1111',
    })
    id: string;

    @ApiProperty({
        example: 'a1b2c3d4-1111-2222-3333-444455556666',
    })
    sender_id: string;

    @ApiProperty({
        example: 'b2c3d4e5-7777-8888-9999-000011112222',
    })
    receiver_id: string;

    @ApiProperty({
        enum: chat_request_status,
        example: chat_request_status.pending,
    })
    status: chat_request_status;

    @ApiProperty({
        example: '2026-01-29T10:15:30.000Z',
    })
    created_at: Date;

    @ApiProperty({
        example: '2026-01-29T10:15:30.000Z',
    })
    updated_at: Date;
}
