import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CommentDto {
    @IsNotEmpty()
    @IsUUID()
    postId: string

    // @IsNotEmpty()
    // @IsUUID()
    // userId: string

    @IsString()
    @MaxLength(2000)
    text: string;

    @IsOptional()
    @IsUUID()
    parentId?: string
}
