import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatReport } from '../chat/entities/chat-report.entity';
import { ChatReportCriteria } from '../chat/entities/chat-report-criteria.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { PostReport } from '../post/entities/post-report.entity';
import { PostReportCriteria } from '../post/entities/post-report-criteria.entity';
import { Posts } from '../post/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { ModerationCase } from './entities/moderation-case.entity';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ModerationUserGuard } from './guards/moderation-user.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Posts,
      Conversation,
      PostReport,
      PostReportCriteria,
      ChatReport,
      ChatReportCriteria,
      ModerationCase,
      ModerationAction,
    ]),
  ],
  controllers: [ModerationController],
  providers: [ModerationService, ModerationUserGuard],
  exports: [ModerationService],
})
export class ModerationModule {}
