import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { UserPresenceService } from './services/user-presence.service';

import { Message } from './entities/messages.entity';
import { ConversationMute } from './entities/conversation-mute.entity';
import { ConversationRead } from './entities/conversation-read.entity';
import { ConversationParticipant } from 'src/conversation/entities/conversation-participant.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ChatRequest } from 'src/chat-request/entities/chat-request.entity';
import { Files } from '../files/entities/file.entity';
import { ChatReport } from './entities/chat-report.entity';
import { ChatReportCriteria } from './entities/chat-report-criteria.entity';
import { UserChattHide } from './entities/user-chat-hide.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ChatRequest,
      Conversation,
      ConversationParticipant,
      ConversationMute,
      ConversationRead,
      Message,
      Files,
      ChatReport,
      ChatReportCriteria,
      UserChattHide,
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
