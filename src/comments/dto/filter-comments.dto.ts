
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class FilterCommentDto extends PaginationDto {
  @ApiProperty({ description: 'post id', example: 'xxxx-xxxx-xxxx-xxxx', required: true })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  // @ApiProperty({ description: 'last updated_at', example: 'xxxx-xxxx-xxxx-xxxx', required: false })
  // @IsDateString()
  // @IsOptional()
  // updated_at?: string // ISO timestamp
}
