import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterStickerUploadDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by sticker upload ID',
    required: false,
    example: 'b7a8d0f0-4bf6-4f9d-9ef4-5dbf70a6c8f4',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Filter by uploader user ID',
    required: false,
    example: 'f43d7e6a-0a32-4a7f-8e3a-2c8d7f4b0c31',
  })
  @IsOptional()
  @IsUUID()
  uploaded_by_user_id?: string;

  @ApiProperty({
    description: 'Filter by sticker file ID',
    required: false,
    example: 123,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  file_id?: number;

  @ApiProperty({
    description: 'Filter by active status',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_active?: boolean;
}
