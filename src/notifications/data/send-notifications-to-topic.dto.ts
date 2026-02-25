import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';

import { FireBaseTopicsEnum } from './fire-base-topics.data';

export class SendNotificationToTopicDto {
  @ApiProperty({
    description: 'Session Type either Personal or Group',
    enum: FireBaseTopicsEnum,
    required: true,
    example: FireBaseTopicsEnum.AllUser,
  })
  @IsEnum(FireBaseTopicsEnum, { message: 'Topic must be within the options' })
  topic: FireBaseTopicsEnum;

  @ApiProperty({
    description: 'Notification Title',
    required: true,
    example: 'Welcome to Blue Atlantic',
  })
  @IsOptional()
  title: string;

  @ApiProperty({
    description: 'Notification Message',
    required: true,
    example: "Let's make wonder together",
  })
  @IsOptional()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional data payload to send with the notification',
    example: { type: 'chat', chatId: '123' },
    type: Object,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}
