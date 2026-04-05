import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CommentDto {
    @IsNotEmpty()
    @IsUUID()
    postId: string

    @IsString()
    @MaxLength(2000)
    text: string;

    @IsOptional()
    @IsUUID()
    parentId?: string

    @IsNumber()
    @IsOptional()
    file_id: number;
}
