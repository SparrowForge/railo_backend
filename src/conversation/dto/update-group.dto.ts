import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGroupDto {
    @ApiProperty({ description: 'New group title', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'New group image id', required: false })
    @IsOptional()
    @IsNumber()
    image_id?: number;
}
