import { ApiProperty } from '@nestjs/swagger';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class FilterChatDto extends PaginationDto {
  @ApiProperty({ description: 'user_id', example: '2c5f9a44-9e6b-4d9a-a6a5-3d9d2c7f1111', required: false })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
