import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ description: 'Country name', example: 'Bangladesh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country_name: string;

  @ApiProperty({ description: 'Country code', example: 'BD' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  country_code: string;

  @ApiProperty({ description: 'Phone code', example: '+880' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone_code: string;
}
