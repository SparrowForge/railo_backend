import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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

import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateNotificationRecordDto } from './dto/create-notification-record.dto';
import { FilterNotificationRecordDto } from './dto/filter-notification-record.dto';
import { UpdateNotificationRecordDto } from './dto/update-notification-record.dto';
import { NotificationRecord } from './entities/notification-record.entity';
import { NotificationRecordService } from './notification-record.service';

@ApiTags('Notification Records')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/notification-records')
export class NotificationRecordController {
  constructor(
    private readonly notificationService: NotificationRecordService,
  ) { }


  @Get()
  @ApiOperation({
    summary: 'List notification records with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notification records',
    type: BaseResponseDto<PaginatedResponseDto<NotificationRecord>>,
  })
  async findAll(@Query() filters: FilterNotificationRecordDto) {
    const { page, limit, ...rest } = filters;
    const pagination = { page, limit };
    const result = await this.notificationService.findAll(
      pagination,
      rest,
    );
    return new BaseResponseDto(result, 'Notification records retrieved');
  }

  @Get('/unseen-notifications-count')
  @ApiOperation({ summary: 'User: Total unseen notifications count' })
  @ApiResponse({
    status: 200,
    description: 'User: List of notification records',
    type: () => Number,
  })
  async unseenNotificationCount(@Query('userId') userId: string) {
    const result =
      await this.notificationService.unseenNotificationCount(userId);
    return new BaseResponseDto(result);
  }


  @Get('summary')
  @ApiOperation({ summary: 'Summary' })
  @ApiResponse({
    status: 200,
    description: 'List of notification records',
  })
  async getSummary() {
    const result = await this.notificationService.summary();
    return new BaseResponseDto(result);
  }



  @Post()
  @ApiOperation({ summary: 'Create a new notification record' })
  @ApiResponse({
    status: 201,
    description: 'Notification record created',
    type: BaseResponseDto<NotificationRecord>,
  })
  async create(@Body() dto: CreateNotificationRecordDto) {
    try {
      console.log('create start');
      const created =
        await this.notificationService.createNotification(dto);
      return new BaseResponseDto(created, 'Notification record created');
    } catch (error) {
      console.log(error);
      return new BaseResponseDto('Some error happened');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record found',
    type: BaseResponseDto<NotificationRecord>,
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const item = await this.notificationService.findOne(id);
    return new BaseResponseDto(item, 'Notification record retrieved');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record updated',
    type: BaseResponseDto<NotificationRecord>,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationRecordDto,
  ) {
    const res = await this.notificationService.update(id, dto);
    return new BaseResponseDto(res, 'Notification record updated');
  }

  @Patch('seen/:id')
  @ApiOperation({ summary: 'Update notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record updated',
    type: BaseResponseDto<NotificationRecord>,
  })
  async seen(@Param('id', ParseIntPipe) id: number) {
    const res = await this.notificationService.seen(id);
    return new BaseResponseDto(res, 'Notification seen');
  }

  @Patch('unseen/:id')
  @ApiOperation({ summary: 'Update notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record updated',
    type: BaseResponseDto<NotificationRecord>,
  })
  async unseen(@Param('id', ParseIntPipe) id: number) {
    const res = await this.notificationService.unseen(id);
    return new BaseResponseDto(res, 'Notification seen');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record soft deleted',
    type: BaseResponseDto<null>,
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.remove(id);
    return new BaseResponseDto(null, 'Notification record soft deleted');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted notification record' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record restored',
    type: BaseResponseDto<null>,
  })
  async restore(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.restore(id);
    return new BaseResponseDto(null, 'Notification record restored');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete notification record by id' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record permanently deleted',
    type: BaseResponseDto<null>,
  })
  async permanentRemove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.permanentRemove(id);
    return new BaseResponseDto(null, 'Notification record permanently deleted');
  }

  @Delete('/delete-by-user-id/:userId')
  @ApiOperation({
    summary: 'Permanently delete notification record by user id',
  })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Notification record permanently deleted',
    type: BaseResponseDto<null>,
  })
  async deleteByUserId(@Param('userId') userId: string) {
    const res = await this.notificationService.deleteByUserId(userId);
    return new BaseResponseDto(
      res,
      'User all notifications permanently deleted',
    );
  }
}
