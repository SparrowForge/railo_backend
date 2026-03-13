import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { UserPresenceService } from './services/user-presence.service';

import { Message } from './entities/messages.entity';
import { ConversationMute } from './entities/conversation-mute.entity';
import { ConversationRead } from './entities/conversation-read.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Conversation,
      ConversationMute,
      ConversationRead,
      Message,
    ]),
    AuthModule,
    NotificationsModule
  ],
  providers: [
    ChatGateway,
    ChatService,
    UserPresenceService
  ],
  controllers: [ChatController],
  exports: [ChatService, UserPresenceService],
})
export class ChatModule { }
