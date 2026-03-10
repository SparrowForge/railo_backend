import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostLike } from './entities/post-like.entity';
import { Posts } from './entities/post.entity';
import { UserLocation } from 'src/user-location/entities/user-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Posts, PostLike, UserLocation]),],
  providers: [PostService],
  controllers: [PostController]
})
export class PostModule { }
