import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ReadAllChatRequestDto {
  @ApiProperty({ description: 'Conversation Guid Id', example: 'xxxx-xxxx-xxxx-xxxx', required: true })
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;
}
