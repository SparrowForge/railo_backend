import { Module } from '@nestjs/common';
import { ChatRequestService } from './chat-request.service';
import { ChatRequestController } from './chat-request.controller';
import { ChatRequest } from './entities/chat-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRequest, Conversation]),],
  providers: [ChatRequestService],
  controllers: [ChatRequestController]
})
export class ChatRequestModule { }
