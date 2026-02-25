import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateChatRequestDto {
    @ApiProperty({
        description: 'receiver user id',
        example: '9a7c1b44-0a5e-4d3a-9f62-1c6a9f4b1234',
    })
    @IsUUID()
    receiver_id: string;
}
