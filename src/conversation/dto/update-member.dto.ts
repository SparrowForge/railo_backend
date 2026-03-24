import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateMemberDto {
    @ApiProperty({ description: 'Whether the member is admin' })
    @IsBoolean()
    is_admin: boolean;

    @ApiProperty({ description: 'User ID of the member' })
    @IsUUID()
    user_id: string;
}