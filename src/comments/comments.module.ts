import { Module, forwardRef } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentService } from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comments } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Posts } from 'src/post/entities/post.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CommentReport } from './entities/comment-report.entity';
import { CommentReportCriteria } from './entities/comment-report-criteria.entity';
import { ModerationModule } from 'src/moderation/moderation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Posts, Comments, CommentLike, CommentReport, CommentReportCriteria]),
    NotificationsModule,
    forwardRef(() => ModerationModule),
  ],
  providers: [CommentService],
  controllers: [CommentsController]
})
export class CommentsModule { }
