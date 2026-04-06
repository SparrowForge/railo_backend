import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSubscriptionPackageDto extends PaginationDto {
  @ApiProperty({ description: 'Package type', required: false, example: 'popular/bestdeal' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Discounted package status', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;
}
