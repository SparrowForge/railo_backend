import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BoostPackageTypeEnum } from './boost-package-type.enum';

class CreateBoostPackageBenefitDto {
  @ApiProperty({
    description: 'Benefit row id. Optional for create, useful on update payloads.',
    required: false,
    example: '20762ef6-fea1-4353-b5de-f1407a3c5843',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Benefit description', example: 'Priority placement' })
  @IsString()
  @IsNotEmpty()
  desc: string;
}

export class CreateBoostPackageDto {
  @ApiProperty({ description: 'Package price', example: 0 })
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Discounted percentage of package price', example: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discountPercentage: number;

  @ApiProperty({ description: 'Discounted package price', example: 0 })
  @Type(() => Number)
  @IsNumber()
  discountPrice: number;

  @ApiProperty({ description: 'Package duration', example: 0 })
  @Type(() => Number)
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Package type', example: 'popular/bestdeal' })
  @IsEnum(BoostPackageTypeEnum)
  @IsNotEmpty()
  type: BoostPackageTypeEnum;

  @ApiProperty({ description: 'Boost package status', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @ApiProperty({
    description: 'Benefit details rows',
    type: CreateBoostPackageBenefitDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBoostPackageBenefitDto)
  benifits: CreateBoostPackageBenefitDto[];
}

export { CreateBoostPackageBenefitDto };
