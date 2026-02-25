import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserToFirebaseTokenMap } from './entity/userToFirebaseTokenMap.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { FirebaseProvider } from '../lib/firebase.provider';

@Module({
  imports: [TypeOrmModule.forFeature([UserToFirebaseTokenMap])],
  controllers: [NotificationsController],
  providers: [NotificationService, FirebaseProvider],
  exports: [NotificationService, FirebaseProvider],
})
export class NotificationsModule { }
