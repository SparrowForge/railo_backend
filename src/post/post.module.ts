import { Module, forwardRef } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLike } from './entities/post-like.entity';
import { PostPin } from './entities/post-pin.entity';
import { Posts } from './entities/post.entity';
import { PostView } from './entities/post-view.entity';
import { UserLocation } from 'src/user-location/entities/user-location.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { PostPollOption } from './entities/post-poll-options.entity';
import { PostFile } from './entities/post-file.entity';
import { PostReport } from './entities/post-report.entity';
import { PostReportCriteria } from './entities/post-report-criteria.entity';
import { PostHide } from './entities/post-hide.entity';
import { PostNotification } from './entities/post-notification.entity';
import { UserPosttHide } from './entities/user-post-hide.entity';
import { PostPollVote } from './entities/post-poll-vote.entity';
import { ModerationModule } from 'src/moderation/moderation.module';
import { Comments } from 'src/comments/entities/comment.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Posts,
      PostLike,
      PostPin,
      PostView,
      UserLocation,
      PostPollOption,
      PostPollVote,
      PostFile,
      PostReport,
      PostReportCriteria,
      PostHide,
      PostNotification,
      UserPosttHide,
      Comments]),
    NotificationsModule,
    forwardRef(() => ModerationModule),
  ],
  providers: [PostService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule { }
