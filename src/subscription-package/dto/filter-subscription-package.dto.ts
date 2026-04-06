import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PackageTypeEnum } from './package-type.enum';

export class FilterSubscriptionPackageDto extends PaginationDto {
  @ApiProperty({ description: 'Package type', example: 'popular/bestdeal' })
  @IsEnum(PackageTypeEnum)
  @IsOptional()
  type: PackageTypeEnum;

  @ApiProperty({ description: 'Discounted package status', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
