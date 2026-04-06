import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PackageTypeEnum } from './package-type.enum';

class CreateSubscriptionPackageBenefitDto {
  @ApiProperty({
    description: 'Benefit row id. Optional for create, useful on update payloads.',
    required: false,
    example: '20762ef6-fea1-4353-b5de-f1407a3c5843',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'Benefit description', example: 'test' })
  @IsString()
  @IsNotEmpty()
  desc: string;
}

export class CreateSubscriptionPackageDto {
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
  @IsEnum(PackageTypeEnum)
  @IsNotEmpty()
  type: PackageTypeEnum;

  @ApiProperty({ description: 'Discounted package status', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @ApiProperty({
    description: 'Benefit details rows',
    type: CreateSubscriptionPackageBenefitDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionPackageBenefitDto)
  benifits: CreateSubscriptionPackageBenefitDto[];
}

export { CreateSubscriptionPackageBenefitDto };
