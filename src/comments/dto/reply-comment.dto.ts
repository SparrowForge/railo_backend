import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReplyCommentDto {
    @IsNotEmpty()
    @IsUUID()
    parentCommentId: string

    @ApiProperty({ example: 'This is a reply', })
    @IsString()
    @MaxLength(2000)
    text: string;

    @IsNumber()
    @IsOptional()
    file_id: number;
}
