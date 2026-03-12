import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { PostTypeEnum } from 'src/common/enums/post-type.enum';
import { PostVisibilityEnum } from 'src/common/enums/post-visibility.enum';


export class CreatePostDto {
    @ApiPropertyOptional({ description: 'Post text content', example: 'Hello world!', maxLength: 5000, })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    text?: string;

    @ApiProperty({ description: 'Post type', enum: PostTypeEnum, example: PostTypeEnum.regular, })
    @IsEnum(PostTypeEnum, { message: `Post type must be one of the allowed values. Allowed values are: ${Object.values(PostTypeEnum).join(', ')}` })
    postType: PostTypeEnum;

    @ApiPropertyOptional({ description: 'Post visibility', enum: PostVisibilityEnum, example: PostVisibilityEnum.NORMAL, })
    @IsOptional()
    @IsEnum(PostVisibilityEnum, { message: `Visbility types must be within the allowed values. Allowed values are: ${Object.values(PostVisibilityEnum).join(', ')}` })
    visibility?: PostVisibilityEnum;

    @ApiPropertyOptional({ description: 'Uploaded file ID (image, audio, video)', example: '7b9c2d64-0fcb-4db2-8c20-1cbb6db7d9f3', })
    @IsOptional()
    @IsNumber()
    fileId?: number;

    @ApiPropertyOptional({ description: 'Selected location ID', example: '3f92a5b2-7b8f-4fa6-9b21-4c2f5e3a1c0d', })
    @IsOptional()
    @IsUUID()
    locationId?: string;
}
