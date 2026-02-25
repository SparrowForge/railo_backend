import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { NotificationDeliveryStatusType } from '../data/notification-delivery-status-type.data';
import { CreateNotificationRecordDto } from './create-notification-record.dto';

export class UpdateNotificationRecordDto extends PartialType(
  CreateNotificationRecordDto,
) {

  @ApiProperty({ description: 'Notification Title', example: 'Some Title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  notificationTitle: string;

  @ApiProperty({
    description: 'Notification Message',
    example: 'Some message to send to the user.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  notificationMessage: string;

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

  @ApiProperty({ description: 'User ID', example: 39 })
  @IsUUID()
  @IsOptional()
  userId?: number;
}
