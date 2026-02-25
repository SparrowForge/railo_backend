import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// import { admin } from 'src/firebase.config';
import * as admin from 'firebase-admin';
import { In, MoreThan, Repository } from 'typeorm';

import { FireBaseTopicsEnum } from './data/fire-base-topics.data';
import { UserToFirebaseTokenMap } from './entity/userToFirebaseTokenMap.entity';


@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(UserToFirebaseTokenMap)
    private userToFirebaseTokenMapRepository: Repository<UserToFirebaseTokenMap>,

    @Inject('FIREBASE_ADMIN')
    private readonly firebaseAdmin: typeof admin,
  ) { }

  async saveUserToTokenMap(userId: string, token: string) {
    const userSavedToken = await this.userToFirebaseTokenMapRepository.findOne({
      where: {
        userId,
        token,
      },
    });
    if (!userSavedToken) {
      await this.userToFirebaseTokenMapRepository.save({
        userId,
        token,
        lastActiveAt: new Date(),
      });
    } else {
      userSavedToken.lastActiveAt = new Date();
      await this.userToFirebaseTokenMapRepository.update(
        userSavedToken.id,
        userSavedToken,
      );
    }
  }

  async getAllUserToTokenMap() {
    return await this.userToFirebaseTokenMapRepository.find();
  }

  async deleteUserToTokenMappByUser(userId: string) {
    await this.userToFirebaseTokenMapRepository.delete({ userId });
  }

  async deleteUserToTokenMappByToken(token: string) {
    await this.userToFirebaseTokenMapRepository.delete({ token });
  }

  async sendNotificationToSingleDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!data) {
      data = {
        "click_action": "EXAMPLE_NOTIFICATION_CLICK",
        "sound": "default",
        "priority": "high",
        "content_available": "true"
      };
    }
    const message: admin.messaging.Message = {
      notification: { title, body },
      token,
      data,
    };

    try {
      const response = await this.firebaseAdmin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendNotificationToDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!tokens || tokens.length === 0) {
      console.error('No device tokens provided');
      return;
    }

    const message: admin.messaging.MulticastMessage = {
      notification: { title, body },
      tokens,
      data,
    };

    try {
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast(message);

      // Optional: clean up invalid tokens
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `Failed token [${tokens[idx]}]:`,
            resp.error?.message || 'Unknown error',
          );
          failedTokens.push(tokens[idx]);
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async sendNotificationToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    const message: admin.messaging.Message = {
      notification: { title, body },
      topic,
      data,
    };

    try {
      const response = await this.firebaseAdmin.messaging().send(message);
      return response;
    } catch (error) {
      console.error(`Error sending notification to topic "${topic}":`, error);
      throw error;
    }
  }

  async sendNotificationToUser({
    userId,
    title,
    body,
    payload,
  }: {
    userId: string;
    title: string;
    body: string;
    payload?: Record<string, string>;
  }) {
    const activeLimit = new Date();
    activeLimit.setDate(activeLimit.getDate() - 30);

    const tokensByUserId = await this.userToFirebaseTokenMapRepository.find({
      where: {
        userId,
        lastActiveAt: MoreThan(activeLimit),
      },
    });

    if (!tokensByUserId || tokensByUserId.length === 0) {
      console.log(`No tokens found for user with ID ${userId}`);
      return;
    }

    const tokens = tokensByUserId.map((token) => token.token);
    const res = await this.sendNotificationToDevices(
      tokens,
      title,
      body,
      payload,
    );

    //delete failed token
    if (Array.isArray(res?.failedTokens) && res.failedTokens.length > 0) {
      await this.userToFirebaseTokenMapRepository.delete({
        token: In(res.failedTokens),
      });
    }
  }

  async subscribeToTopic(tokens: string[], topic: FireBaseTopicsEnum) {
    try {
      const response = await this.firebaseAdmin.messaging().subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error(`Error subscribing to topic "${topic}":`, error);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: FireBaseTopicsEnum) {
    try {
      const response = await this.firebaseAdmin
        .messaging()
        .unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error(`Error unsubscribing from topic "${topic}":`, error);
      throw error;
    }
  }
}
