import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { PostTypeEnum } from 'src/common/enums/post-type.enum';
import { PostVisibilityEnum } from 'src/common/enums/post-visibility.enum';

export class UpdatePostDto {
    @ApiPropertyOptional({ description: 'Updated post text', example: 'Updated post content', })
    @IsOptional()
    @IsString()
    @MaxLength(5000)
    text?: string;

    @ApiPropertyOptional({ enum: PostTypeEnum, })
    @IsNotEmpty()
    @IsEnum(PostTypeEnum, { message: `Post type must be one of the allowed values. Allowed values are: ${Object.values(PostTypeEnum).join(', ')}` })
    postType: PostTypeEnum;

    @ApiPropertyOptional({ enum: PostVisibilityEnum, })
    @IsOptional()
    @IsEnum(PostVisibilityEnum)
    visibility?: PostVisibilityEnum;

    @ApiPropertyOptional({ description: 'Uploaded file ID (image, audio, video)', example: '7b9c2d64-0fcb-4db2-8c20-1cbb6db7d9f3', })
    @IsOptional()
    @IsNumber()
    fileId?: number;

    @ApiPropertyOptional({ description: 'Update location', })
    @IsOptional()
    @IsUUID()
    locationId?: string;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    @Transform(({ value }: { value: string[] }) =>
        value?.map((v: string) => v.trim())
    )
    pollOptionIds?: string[];
}
