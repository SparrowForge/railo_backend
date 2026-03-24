import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class CreateGroupConversationDto {
    @ApiProperty({
        description: 'Group conversation title',
        example: 'Weekend Plan',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Participant user ids excluding the creator',
        type: [String],
        example: [
            '9a7c1b44-0a5e-4d3a-9f62-1c6a9f4b1234',
            'd6248a44-47d2-42ea-8af0-2cf3f3c0f876',
        ],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayUnique()
    @IsUUID(undefined, { each: true })
    participant_ids: string[];

    @ApiPropertyOptional({
        description: 'Optional group image file id',
        example: 12,
    })
    @IsOptional()
    @IsNumber()
    file_id?: number;
}
