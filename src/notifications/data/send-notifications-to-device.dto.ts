import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class SendNotificationToDeviceDto {
  @ApiProperty({
    description: 'Device Token',
    required: true,
    example:
      'cEZ7YYA56-ab1bgyu693Jh:APA91bE43nshE2E5zG-UaWmdVwv-SgqjWosKE6iyDoriepedWjCtAQ6utiQNRvxjEa41xF8EfCcrgb7ptC1Pk7Z2T4xl5V0COaybATtGxtNGI-eqzEOD4o8',
  })
  @IsOptional()
  token: string;

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
