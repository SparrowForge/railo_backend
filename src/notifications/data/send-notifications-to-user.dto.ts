import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class SendNotificationToUserDto {
  @ApiProperty({
    description: 'User Id',
    required: true,
    example: 9,
  })
  @IsUUID()
  userId: string;

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
