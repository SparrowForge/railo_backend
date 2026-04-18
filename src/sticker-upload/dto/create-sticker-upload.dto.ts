import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateStickerUploadDto {
  @ApiProperty({
    description: 'Uploaded file ID that represents the sticker image',
    example: 123,
  })
  @IsInt()
  @Min(1)
  file_id: number;

  @ApiProperty({
    description: 'Whether the sticker is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
