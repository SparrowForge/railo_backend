import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class MyFatoorahWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  EventType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  Data?: Record<string, unknown>;

  [key: string]: unknown;
}
