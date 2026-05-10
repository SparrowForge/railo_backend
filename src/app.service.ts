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
import { ConversationParticipant } from './conversation/entities/conversation-participant.entity';
import { ConversationMute } from './chat/entities/conversation-mute.entity';
import { ConversationPin } from './chat/entities/conversation-pin.entity';
import { ConversationRead } from './chat/entities/conversation-read.entity';
import { ConversationClear } from './conversation/entities/conversation-clear.entity';
import { Follow } from './follow/entities/follow.entity';
import { PostLike } from './post/entities/post-like.entity';
import { Posts } from './post/entities/post.entity';
import { NotificationRecord } from './notification-record/entities/notification-record.entity';
import { UserToFirebaseTokenMap } from './notifications/entity/userToFirebaseTokenMap.entity';
import { AppInstructions } from './app-instructions/entities/app-instructions.entity';
import { Story } from './story/entities/story.entity';
import { StoryView } from './story/entities/story_view.entity';
import { StoryLike } from './story/entities/story_like.entity';
import { DeleteAccount } from './users/entities/delete-account.entity';
import { Contact } from './contact/entity/contact.entity';
import { UserLocation } from './user-location/entities/user-location.entity';
import { PostView } from './post/entities/post-view.entity';
import { PostPin } from './post/entities/post-pin.entity';
import { PollOptions } from './poll-options/entity/poll-options.entity';
import { PostPollOption } from './post/entities/post-poll-options.entity';
import { PostFile } from './post/entities/post-file.entity';
import { PostReport } from './post/entities/post-report.entity';
import { PostReportCriteria } from './post/entities/post-report-criteria.entity';
import { PostHide } from './post/entities/post-hide.entity';
import { PostNotification } from './post/entities/post-notification.entity';
import { UserPosttHide } from './post/entities/user-post-hide.entity';
import { PostPollVote } from './post/entities/post-poll-vote.entity';
import { ChatReport } from './chat/entities/chat-report.entity';
import { ChatReportCriteria } from './chat/entities/chat-report-criteria.entity';
import { UserChattHide } from './chat/entities/user-chat-hide.entity';
import { SubscriptionPackage } from './subscription-package/entities/subscription-package.entity';
import { SubscriptionPackageBenefit } from './subscription-package/entities/subscription-package-benefit.entity';
import { BoostPackage } from './boost-package/entities/boost-package.entity';
import { BoostPackageBenefit } from './boost-package/entities/boost-package-benefit.entity';
import { BoostPaymentRecord } from './boost-payment/entities/boost-payment-record.entity';
import { PostBoost } from './boost-payment/entities/post-boost.entity';
import { SubscriptionPayment } from './payments/entities/subscription-payment.entity';
import { UserSubscription } from './payments/entities/user-subscription.entity';
import { ModerationCase } from './moderation/entities/moderation-case.entity';
import { ModerationAction } from './moderation/entities/moderation-action.entity';
import { ModerationRequest } from './moderation/entities/moderation-request.entity';
import { PaymentRecords } from './payments/entities/payments-record.entity';
import { StickerUpload } from './sticker-upload/entities/sticker-upload.entity';
import { Country } from './country/entities/country.entity';

@Injectable()
export class AppService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

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
        ChatReport,
        ChatReportCriteria,
        Conversation,
        ConversationParticipant,
        ConversationMute,
        ConversationPin,
        ConversationRead,
        ConversationClear,
        Follow,
        PaymentRecords,
        Posts,
        PostLike,
        PostView,
        PostPin,
        PostPollOption,
        PostPollVote,
        PostFile,
        PostReport,
        PostReportCriteria,
        PostHide,
        PostNotification,
        UserPosttHide,
        NotificationRecord,
        UserToFirebaseTokenMap,
        AppInstructions,
        Story,
        StoryView,
        StoryLike,
        DeleteAccount,
        Contact,
        UserLocation,
        UserChattHide,
        PollOptions,
        BoostPackage,
        BoostPackageBenefit,
        BoostPaymentRecord,
        PostBoost,
        SubscriptionPackage,
        SubscriptionPackageBenefit,
        SubscriptionPayment,
        UserSubscription,
        ModerationCase,
        ModerationAction,
        ModerationRequest,
        StickerUpload,
        Country,
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
