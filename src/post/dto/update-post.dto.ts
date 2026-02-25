import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
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

    @ApiPropertyOptional({ description: 'Replace file', })
    @IsOptional()
    @IsUUID()
    fileId?: string;

    @ApiPropertyOptional({ description: 'Update location', })
    @IsOptional()
    @IsUUID()
    locationId?: string;
}
