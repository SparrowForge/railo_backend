import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { PostReportCriteriaEnum } from './post-report-criteria.enum';

export class CreatePostReportDto {
    @ApiProperty({
        description: 'Selected report criteria for the post',
        enum: PostReportCriteriaEnum,
        isArray: true,
        example: [PostReportCriteriaEnum.SPAM, PostReportCriteriaEnum.IMPERSONATION],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsEnum(PostReportCriteriaEnum, { each: true })
    criteria: PostReportCriteriaEnum[];
}
