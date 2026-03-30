import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGroupDto {
    @ApiProperty({ description: 'Title of the group conversation' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'Image ID for the group', required: false })
    @IsOptional()
    @IsNumber()
    image_id?: number;

    @ApiProperty({ description: 'List of initial members', type: [Object] })
    @IsArray()
    @IsOptional()
    members: CreateGroupMemberDto[];
}

export class CreateGroupMemberDto {
    @ApiProperty({ description: 'User ID of the member' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ description: 'Whether the member is admin', default: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string' && value.toLowerCase() === 'true') return true;
        if (typeof value === 'string' && value.toLowerCase() === 'false') return false
        return undefined;
    })
    is_admin?: boolean;
}