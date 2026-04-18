import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewModerationRequestDto {
  @ApiProperty({
    required: false,
    example: 'Approved after verifying account history and trust level.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiProperty({
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  approve?: boolean;
}

