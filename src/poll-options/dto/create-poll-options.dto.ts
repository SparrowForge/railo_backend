import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PollOptions } from '../entity/poll-options.entity';
import { Transform } from 'class-transformer';


export class CreatePollOptionsDto extends PartialType(PollOptions) {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  remarks: string;

  @IsUUID()
  @IsOptional()
  created_by_user_id: string;

  @IsBoolean()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return undefined;
  })
  is_active: boolean;
}
