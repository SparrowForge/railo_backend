import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';
import { ChatReportCriteriaEnum } from './chat-report-criteria.enum';

export class CreateChatReportDto {
    @ApiProperty({
        description: 'Selected report criteria for the chat user',
        enum: ChatReportCriteriaEnum,
        isArray: true,
        example: [ChatReportCriteriaEnum.SPAM, ChatReportCriteriaEnum.IMPERSONATION],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsEnum(ChatReportCriteriaEnum, { each: true })
    criteria: ChatReportCriteriaEnum[];
}
