import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateModerationRequestDto {
  @ApiProperty({
    required: false,
    example: 'I have experience moderating communities and want to help review reports.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

