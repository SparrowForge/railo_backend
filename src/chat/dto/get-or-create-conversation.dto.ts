import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class GetOrCreateConversationDto {
    @ApiProperty({
        description: 'Other user id',
        example: '9a7c1b44-0a5e-4d3a-9f62-1c6a9f4b1234',
    })
    @IsUUID()
    @IsNotEmpty()
    user_id: string;
}
