import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatReport } from '../chat/entities/chat-report.entity';
import { ChatReportCriteria } from '../chat/entities/chat-report-criteria.entity';
import { CommentReport } from '../comments/entities/comment-report.entity';
import { CommentReportCriteria } from '../comments/entities/comment-report-criteria.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { PostReport } from '../post/entities/post-report.entity';
import { PostReportCriteria } from '../post/entities/post-report-criteria.entity';
import { Posts } from '../post/entities/post.entity';
import { PostModule } from '../post/post.module';
import { User } from '../users/entities/user.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { ModerationCase } from './entities/moderation-case.entity';
import { ModerationRequest } from './entities/moderation-request.entity';
import { ModerationController } from './moderation.controller';
import { ModerationRequestsController } from './moderation-requests.controller';
import { ModerationService } from './moderation.service';
import { ModerationUserGuard } from './guards/moderation-user.guard';
import { Comments } from 'src/comments/entities/comment.entity';
import { ModerationPointThreshold } from './entities/moderation-point-threshold.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Posts,
      Conversation,
      Comments,
      PostReport,
      PostReportCriteria,
      ChatReport,
      ChatReportCriteria,
      CommentReport,
      CommentReportCriteria,
      ModerationCase,
      ModerationAction,
      ModerationRequest,
      ModerationPointThreshold,
    ]),
    forwardRef(() => PostModule),
  ],
  controllers: [ModerationController, ModerationRequestsController],
  providers: [ModerationService, ModerationUserGuard],
  exports: [ModerationService],
})
export class ModerationModule { }
