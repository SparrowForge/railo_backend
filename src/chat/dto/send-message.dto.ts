import { IsUUID, IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({
        description: 'Conversation id',
        example: '8c9f2f8a-4b2a-4c7d-9d1e-91a8a9a1f111',
    })
    @IsUUID()
    conversation_id: string;

    @ApiProperty({
        description: 'Message text',
        example: 'Hello! How are you?',
        maxLength: 5000,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    text: string;

    @ApiProperty({
        description: 'Reply to message id',
        required: false,
        example: 'f5a4a2d9-1111-4a4b-bbbb-222222222222',
    })
    @IsOptional()
    @IsUUID()
    reply_to_message_id?: string;

    @ApiProperty({ description: 'File id', required: false, example: 1, })
    @IsOptional()
    @IsNumber()
    file_id?: number;
}
