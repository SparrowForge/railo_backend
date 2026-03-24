import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AddMemberDto {
    @ApiProperty({ description: 'User ID to add' })
    @IsUUID()
    user_id: string;

    @ApiProperty({ description: 'Whether to assign as admin', default: false })
    @IsOptional()
    @IsBoolean()
    is_admin?: boolean;
}