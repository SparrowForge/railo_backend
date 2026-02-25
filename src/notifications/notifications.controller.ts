/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

import { SaveUsetToTokenMapDto } from './data/save-user-to-token-map';
import { SendNotificationToDeviceDto } from './data/send-notifications-to-device.dto';
import { SendNotificationToTopicDto } from './data/send-notifications-to-topic.dto';
import { SendNotificationToUserDto } from './data/send-notifications-to-user.dto';
import { SubscribeToTopicDto } from './data/subscribe-to-topic.dto';
import { UserToFirebaseTokenMap } from './entity/userToFirebaseTokenMap.entity';
import { NotificationService } from './notifications.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly firebaseService: NotificationService) { }

  @Post('save-user-to-token-map/:token')
  @ApiOperation({ summary: 'User to token map creation' })
  @ApiResponse({
    status: 201,
    description: 'User to token map created',
    type: BaseResponseDto<string>,
  })
  async saveUserToTokenMap(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    const res = await this.firebaseService.saveUserToTokenMap(
      user.userId,
      token,
    );
    return new BaseResponseDto(res, 'User to token map created');
  }

  @Get('get-all-user-to-token-map')
  @ApiOperation({ summary: 'Get allUser to token map' })
  @ApiResponse({
    status: 201,
    description: 'List of User to token map',
    type: BaseResponseDto<UserToFirebaseTokenMap>,
  })
  async getAllUserToTokenMap(@Body() body: { userId: number; token: string }) {
    const res = await this.firebaseService.getAllUserToTokenMap();
    return new BaseResponseDto(res, 'List of User to token mapping');
  }

  @Delete('delete-user-to-token-map-by-user-id')
  @ApiOperation({ summary: 'Delete mapping by user id' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({
    status: 204,
    description: 'User mapping is deleted',
    type: BaseResponseDto<null>,
  })
  async deleteUserToTokenMappByUser(@Query('userId') userId: string) {
    await this.firebaseService.deleteUserToTokenMappByUser(userId);
    return new BaseResponseDto(null, 'User mapping is deleted');
  }

  @Delete('delete-user-to-token-map-by-token')
  @ApiOperation({ summary: 'Delete mapping by token' })
  @ApiParam({ name: 'token', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'User mapping is deleted',
    type: BaseResponseDto<null>,
  })
  async deleteUserToTokenMappByToken(@Query('token') token: string) {
    await this.firebaseService.deleteUserToTokenMappByToken(token);
    return new BaseResponseDto(null, 'User mapping is deleted');
  }

  @Post('send-notifications-to-device')
  async sendNotificationToDevice(@Body() body: SendNotificationToDeviceDto) {
    return this.firebaseService.sendNotificationToSingleDevice(
      body.token,
      body.title,
      body.message,
      body.data,
    );
  }

  @Post('send-notifications-to-topic')
  @ApiOperation({ summary: 'Send notification to topic' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully',
    type: String,
  })
  async sendNotificationToTopic(@Body() body: SendNotificationToTopicDto) {
    return this.firebaseService.sendNotificationToTopic(
      body.topic,
      body.title,
      body.message,
    );
  }

  @Post('send-notifications-to-user')
  @ApiOperation({ summary: 'Send notification to user' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent successfully to user all devices',
    type: String,
  })
  async sendNotificationToUser(@Body() req_body: SendNotificationToUserDto) {
    const { userId, title, message: body } = req_body;
    console.log(body);
    return this.firebaseService.sendNotificationToUser({ userId, title, body, payload: req_body.data });
  }

  @Post('subscribe-to-topic')
  @ApiOperation({ summary: 'User subscription to a topic by tokens' })
  @ApiResponse({
    status: 200,
    description: 'User subscription to this topic successfully',
  })
  async subscribeToTopic(@Body() body: SubscribeToTopicDto) {
    console.log(body);
    return this.firebaseService.subscribeToTopic(body.tokens, body.topic);
  }

  @Post('unsubscribe-to-topic')
  @ApiOperation({ summary: 'User unsubscription from a topic by tokens' })
  @ApiResponse({
    status: 200,
    description: 'User unsubscription from this topic successfully',
  })
  async unsubscribeFromTopic(@Body() body: SubscribeToTopicDto) {
    console.log(body);
    return this.firebaseService.unsubscribeFromTopic(body.tokens, body.topic);
  }
}
