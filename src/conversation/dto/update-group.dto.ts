import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { UpdateMemberDto } from './update-member.dto';

export class UpdateGroupDto {
    @ApiProperty({ description: 'New group title', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ description: 'New group image id', required: false })
    @IsOptional()
    @IsNumber()
    image_id?: number;

    @ApiProperty({ description: 'List of initial members', type: [Object] })
    @IsArray()
    @IsOptional()
    members: UpdateMemberDto[];
}
