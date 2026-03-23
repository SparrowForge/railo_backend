import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateChatRequestDto {
    @ApiProperty({
        description: 'receiver user id',
        example: '9a7c1b44-0a5e-4d3a-9f62-1c6a9f4b1234',
    })
    @IsUUID()
    receiver_id: string;

    @ApiProperty({
        description: 'initial chat request message',
        example: 'Hi, I would like to chat with you.',
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}
