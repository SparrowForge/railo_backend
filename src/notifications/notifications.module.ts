import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserToFirebaseTokenMap } from './entity/userToFirebaseTokenMap.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { FirebaseProvider } from '../lib/firebase.provider';
import { NotificationRecord } from '../notification-record/entities/notification-record.entity';
import { PostNotification } from 'src/post/entities/post-notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserToFirebaseTokenMap, NotificationRecord, PostNotification])],
  controllers: [NotificationsController],
  providers: [NotificationService, FirebaseProvider],
  exports: [NotificationService, FirebaseProvider],
})
export class NotificationsModule { }
