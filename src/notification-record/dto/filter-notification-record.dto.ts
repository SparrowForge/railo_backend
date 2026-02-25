import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { NotificationDeliveryStatusType } from '../data/notification-delivery-status-type.data';

export class FilterNotificationRecordDto extends PaginationDto {
  @ApiProperty({
    description: 'Delivery Status',
    example: NotificationDeliveryStatusType.Pending,
    enum: NotificationDeliveryStatusType,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationDeliveryStatusType, {
    message: 'Delivery Status must be either Delivered or Pending',
  })
  deliveryStatus?: NotificationDeliveryStatusType;

  @ApiProperty({ description: 'User ID', example: 39, required: false })
  @IsUUID()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    description: 'Is Seen',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBooleanString()
  isSeen?: boolean;
}
