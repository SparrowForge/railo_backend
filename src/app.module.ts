import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuditInterceptorProvider } from './common/providers/audit-interceptor.provider';
import { AuditModule } from './audits/audits.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './common/guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { FilesModule } from './files/files.module';
import { PostModule } from './post/post.module';
import { FollowModule } from './follow/follow.module';
import { CommentsModule } from './comments/comments.module';
import { ChatRequestModule } from './chat-request/chat-request.module';
import { ConversationModule } from './conversation/conversation.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationRecordModule } from './notification-record/notification-record.module';
import { AppInstructionsModule } from './app-instructions/app-instructions.module';
import { StoryModule } from './story/story.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactModule } from './contact/contact.module';
import { UserLocationModule } from './user-location/user-location.module';
import { PollOptionsModule } from './poll-options/poll-options.module';
import { BoostPackageModule } from './boost-package/boost-package.module';
import { BoostPaymentModule } from './boost-payment/boost-payment.module';
import { SubscriptionPackageModule } from './subscription-package/subscription-package.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      useClass: AppService,
    }),
    ScheduleModule.forRoot(),
    AuditModule,
    AuthModule,
    CommandModule,
    UsersModule,
    FilesModule,
    PostModule,
    FollowModule,
    CommentsModule,
    ChatRequestModule,
    ConversationModule,
    ChatModule,
    NotificationsModule,
    NotificationRecordModule,
    AppInstructionsModule,
    StoryModule,
    ContactModule,
    UserLocationModule,
    PollOptionsModule,
    BoostPackageModule,
    BoostPaymentModule,
    SubscriptionPackageModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuditInterceptorProvider,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
