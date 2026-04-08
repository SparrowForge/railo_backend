import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { BoostPackageTypeEnum } from './boost-package-type.enum';

export class FilterBoostPackageDto extends PaginationDto {
  @ApiProperty({ description: 'Package type', example: 'popular/bestdeal' })
  @IsEnum(BoostPackageTypeEnum)
  @IsOptional()
  type: BoostPackageTypeEnum;

  @ApiProperty({ description: 'Boost package status', example: true })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive: boolean;
}
