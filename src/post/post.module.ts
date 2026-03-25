import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLike } from './entities/post-like.entity';
import { PostPin } from './entities/post-pin.entity';
import { Posts } from './entities/post.entity';
import { PostView } from './entities/post-view.entity';
import { UserLocation } from 'src/user-location/entities/user-location.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Posts, PostLike, PostPin, PostView, UserLocation]), NotificationsModule],
  providers: [PostService],
  controllers: [PostController]
})
export class PostModule { }
