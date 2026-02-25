import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReplyCommentDto {
    @IsNotEmpty()
    @IsUUID()
    parentCommentId: string

    @ApiProperty({ example: 'This is a reply', })
    @IsString()
    @MaxLength(2000)
    text: string;
}
