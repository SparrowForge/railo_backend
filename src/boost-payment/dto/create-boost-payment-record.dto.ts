/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateBoostPaymentRecordDto {
  @ApiProperty({ example: '5db0af88-91bf-4a69-b998-0f2a7130f692' })
  @IsUUID()
  @IsOptional()
  postId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  IsSuccess?: boolean = true;

  @ApiPropertyOptional({
    example: 6,
    description:
      'How many boosts from the purchased package should be activated immediately for this post',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  boostQuantityToUseNow?: number;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  Message?: string | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  ValidationErrors?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: '6639675' })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined ? value : String(value),
  )
  @IsString()
  InvoiceId?: string | null;

  @ApiPropertyOptional({ example: 'Paid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  InvoiceStatus?: string | null;

  @ApiPropertyOptional({ example: '2026070170' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  InvoiceReference?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  CustomerReference?: string | null;

  @ApiPropertyOptional({
    example: '2026-04-07T14:18:15.643',
    description: 'Provider created datetime in ISO string format',
  })
  @IsOptional()
  @IsString()
  CreatedDate?: string | null;

  @ApiPropertyOptional({ example: '2026-04-10' })
  @IsOptional()
  @IsString()
  ExpiryDate?: string | null;

  @ApiPropertyOptional({ example: '14:18:15.643' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  ExpiryTime?: string | null;

  @ApiPropertyOptional({ example: 24.99 })
  @IsOptional()
  @IsNumber()
  InvoiceValue?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  Comments?: string | null;

  @ApiPropertyOptional({ example: 'Anonymous' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  CustomerName?: string | null;

  @ApiPropertyOptional({ example: '+965' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  CustomerMobile?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  CustomerEmail?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  UserDefinedField?: string | null;

  @ApiPropertyOptional({ example: '24.990 KD' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  InvoiceDisplayValue?: string | null;

  @ApiPropertyOptional({ example: 24.3 })
  @IsOptional()
  @IsNumber()
  DueDeposit?: number | null;

  @ApiPropertyOptional({ example: 'Not Deposited' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  DepositStatus?: string | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  InvoiceItems?: Record<string, unknown>[] | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  InvoiceTransactions?: Record<string, unknown>[] | null;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  @IsOptional()
  @IsArray()
  Suppliers?: Record<string, unknown>[] | null;
}
