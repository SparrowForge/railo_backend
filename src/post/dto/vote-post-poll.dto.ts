import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class VotePostPollDto {
    @ApiProperty({
        description: 'Selected poll option id for the post',
        example: '3f92a5b2-7b8f-4fa6-9b21-4c2f5e3a1c0d',
    })
    @IsUUID()
    pollOptionId: string;
}
