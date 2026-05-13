import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { CommentReportCriteriaEnum } from './comment-report-criteria.enum';

export class CreateCommentReportDto {
    @ApiProperty({
        description: 'Selected report criteria for the comment',
        enum: CommentReportCriteriaEnum,
        isArray: true,
        example: [CommentReportCriteriaEnum.SPAM, CommentReportCriteriaEnum.IMPERSONATION],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsEnum(CommentReportCriteriaEnum, { each: true })
    criteria: CommentReportCriteriaEnum[];
}
