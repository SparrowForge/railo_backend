import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { PasswordResetToken } from './auth/entities/password-reset-token.entity';
import { User } from './users/entities/user.entity';
import { AuditLog } from './audits/entities/audit.entity';
import { Files } from './files/entities/file.entity';
import { FileReference } from './files/entities/file-reference.entity';
import { Message } from './chat/entities/messages.entity';
import { Comments } from './comments/entities/comment.entity';
import { CommentLike } from './comments/entities/comment-like.entity';
import { ChatRequest } from './chat-request/entities/chat-request.entity';
import { Conversation } from './conversation/entities/conversation.entity';
import { ConversationMute } from './chat/entities/conversation-mute.entity';
import { ConversationRead } from './chat/entities/conversation-read.entity';
import { ConversationClear } from './conversation/entities/conversation-clear.entity';
import { Follow } from './follow/entities/follow.entity';
import { PostLike } from './post/entities/post-like.entity';
import { Posts } from './post/entities/post.entity';
import { NotificationRecord } from './notification-record/entities/notification-record.entity';
import { UserToFirebaseTokenMap } from './notifications/entity/userToFirebaseTokenMap.entity';

@Injectable()

export class AppService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) { }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';

    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [
        AuditLog,
        RefreshToken,
        PasswordResetToken,
        User,
        Files,
        FileReference,
        Message,
        Comments,
        CommentLike,
        ChatRequest,
        Conversation,
        ConversationMute,
        ConversationRead,
        ConversationClear,
        Follow,
        PostLike,
        Posts,
        NotificationRecord,
        UserToFirebaseTokenMap
      ],
      synchronize: false, // Never use synchronize in production
      logging: isDevelopment,
      migrations: isDevelopment ? [] : ['dist/migrations/*.js'],
      migrationsRun: !isDevelopment,
      migrationsTableName: 'migrations',
      // Connection pool settings
      extra: {
        max: 20, // Maximum number of connections in the pool
        min: 5, // Minimum number of connections in the pool
        acquire: 60000, // Maximum time (ms) that pool will try to get connection before throwing error
        idle: 10000, // Maximum time (ms) that a connection can be idle before being released
      },
      // SSL configuration - controlled by environment variable
      ssl:
        this.configService.get('DB_SSL_ENABLED') === 'true'
          ? {
            rejectUnauthorized: false,
          }
          : false,
      // Retry configuration
      retryAttempts: 10,
      retryDelay: 3000,
    };
  }
}

