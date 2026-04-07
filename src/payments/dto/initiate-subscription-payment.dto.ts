import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class InitiateSubscriptionPaymentDto {
  @ApiPropertyOptional({
    description:
      'Optional MyFatoorah payment method id. If omitted, backend uses env default or the first available method.',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentMethodId?: number;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  language?: string;
}
