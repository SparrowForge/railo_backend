import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationClear } from './entities/conversation-clear.entity';
import { ChatRequest } from 'src/chat-request/entities/chat-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRequest, Conversation, ConversationClear]),],
  providers: [ConversationService],
  controllers: [ConversationController]
})
export class ConversationModule { }
