
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PostVisibilityEnum } from 'src/common/enums/post-visibility.enum';
import { UserInteractionEnum } from './user-interaction-type.enum';

export class FilterPostDto extends PaginationDto {
  @ApiProperty({ description: 'User Guid Id', example: 'xxxx-xxxx-xxxx-xxxx', required: true })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Post type', enum: PostVisibilityEnum, example: PostVisibilityEnum.NORMAL, })
  @IsEnum(PostVisibilityEnum, { message: `Post type must be one of the allowed values. Allowed values are: ${Object.values(PostVisibilityEnum).join(', ')}` })
  @IsOptional()
  visibility?: PostVisibilityEnum;

  @ApiProperty({ description: 'Post type', enum: UserInteractionEnum, example: UserInteractionEnum.MyRolla, })
  @IsEnum(UserInteractionEnum, { message: `Allowed values are: ${Object.values(UserInteractionEnum).join(', ')}` })
  @IsOptional()
  userInteractionType?: UserInteractionEnum;
}
