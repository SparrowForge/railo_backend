import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsUUID } from 'class-validator';

export class UpdateMemberDto {
    @ApiProperty({ description: 'Whether the member is admin' })
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string' && value.toLowerCase() === 'true') return true;
        if (typeof value === 'string' && value.toLowerCase() === 'false') return false
        return undefined;
    })
    is_admin: boolean;

    @ApiProperty({ description: 'User ID of the member' })
    @IsUUID()
    user_id: string;
}