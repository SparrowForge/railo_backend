import { ApiProperty } from '@nestjs/swagger';
// import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterAuditDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by username | action | target',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by resource ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiProperty({
    description: 'Filter by resource ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetDays?: string;

  // @ApiProperty({
  //   description: 'Filter by user ID',
  //   required: false,
  // })
  // @IsOptional()
  // @Type(() => Number)
  // @IsNumber()
  // userId?: number;

  // @ApiProperty({
  //   description: 'Filter by username',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // username?: string;

  // @ApiProperty({
  //   description: 'Filter by action (CREATE, READ, UPDATE, DELETE)',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // action?: string;

  // @ApiProperty({
  //   description: 'Filter by resource (users, panels, branches, etc.)',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // resource?: string;

  // @ApiProperty({
  //   description: 'Filter by HTTP method (GET, POST, PUT, DELETE)',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // method?: string;

  // @ApiProperty({
  //   description: 'Filter by IP address',
  //   required: false,
  // })
  // @IsOptional()
  // @IsString()
  // ip?: string;

  // @ApiProperty({
  //   description: 'Filter by response status code',
  //   required: false,
  // })
  // @IsOptional()
  // @Type(() => Number)
  // @IsNumber()
  // responseStatus?: number;

  // @ApiProperty({
  //   description: 'Filter by success status',
  //   required: false,
  // })
  // @IsOptional()
  // @Type(() => Boolean)
  // @IsBoolean()
  // success?: boolean;
}
