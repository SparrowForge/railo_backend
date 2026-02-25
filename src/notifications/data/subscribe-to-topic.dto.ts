import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

import { FireBaseTopicsEnum } from './fire-base-topics.data';

export class SubscribeToTopicDto {
  @ApiProperty({
    description: 'List of device FCM tokens to subscribe',
    required: true,
    example: [
      'cEZ7YYA56-ab1bgyu693Jh:APA91bE43nshE2E5zG-UaWmdVwv-SgqjWosKE6iyDoriepedWjCtAQ6utiQNRvxjEa41xF8EfCcrgb7ptC1Pk7Z2T4xl5V0COaybATtGxtNGI-eqzEOD4o8',
    ],
    isArray: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tokens: string[];

  @ApiProperty({
    description: 'Session Type either Personal or Group',
    enum: FireBaseTopicsEnum,
    required: true,
    example: FireBaseTopicsEnum.AllUser,
  })
  @IsEnum(FireBaseTopicsEnum, { message: 'Topic must be within the options' })
  topic: FireBaseTopicsEnum;
}
