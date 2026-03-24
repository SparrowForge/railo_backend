import { Module } from '@nestjs/common';
import { ChatRequestService } from './chat-request.service';
import { ChatRequestController } from './chat-request.controller';
import { ChatRequest } from './entities/chat-request.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationParticipant } from 'src/conversation/entities/conversation-participant.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Message } from 'src/chat/entities/messages.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRequest, Conversation, ConversationParticipant, Message]),],
  providers: [ChatRequestService],
  controllers: [ChatRequestController]
})
export class ChatRequestModule { }
