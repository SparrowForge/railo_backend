import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentService } from './comments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comments } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Posts } from 'src/post/entities/post.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Posts, Comments, CommentLike]), NotificationsModule],
  providers: [CommentService],
  controllers: [CommentsController]
})
export class CommentsModule { }
