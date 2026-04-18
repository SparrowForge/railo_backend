import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type AuthUser from '../auth/dto/auth-user';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesEnum } from '../common/enums/role.enum';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CreateModerationRequestDto } from './dto/create-moderation-request.dto';
import { ReviewModerationRequestDto } from './dto/review-moderation-request.dto';
import { ModerationRequestStatusEnum } from './enums/moderation-request-status.enum';
import { ModerationService } from './moderation.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Moderation Requests')
@ApiBearerAuth()
@Controller('api/v1/moderation/requests')
export class ModerationRequestsController {
  constructor(private readonly moderationService: ModerationService) { }

  @Post()
  @ApiOperation({ summary: 'Request moderation access' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateModerationRequestDto,
  ) {
    const data = await this.moderationService.createModerationRequest(
      user.userId,
      dto.message,
    );

    return new BaseResponseDto(data, 'Moderation request submitted successfully');
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my moderation requests' })
  async myRequests(@CurrentUser() user: AuthUser) {
    const data = await this.moderationService.getMyModerationRequest(user.userId);
    return new BaseResponseDto(data, 'Moderation requests retrieved successfully');
  }

  @Post('me/cancel')
  @ApiOperation({ summary: 'Cancel my pending moderation request' })
  async cancelMyRequest(@CurrentUser() user: AuthUser) {
    const data = await this.moderationService.cancelModerationRequest(user.userId);
    return new BaseResponseDto(data, 'Moderation request cancelled successfully');
  }

  @Get()
  @Roles(RolesEnum.admin)
  @ApiOperation({ summary: 'List moderation requests' })
  async list(
    @Query() pagination: PaginationDto,
    @Query('status') status?: ModerationRequestStatusEnum,
  ) {
    const data = await this.moderationService.listModerationRequests({
      page: pagination.page,
      limit: pagination.limit,
      status,
    });

    return new BaseResponseDto(data, 'Moderation requests retrieved successfully');
  }

  @Patch(':id/approve')
  @Roles(RolesEnum.admin)
  @ApiOperation({ summary: 'Approve moderation access request' })
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewModerationRequestDto,
  ) {
    const data = await this.moderationService.reviewModerationRequest(
      id,
      user.userId,
      true,
      dto.note,
    );

    return new BaseResponseDto(data, 'Moderation request approved successfully');
  }

  @Patch(':id/reject')
  @Roles(RolesEnum.admin)
  @ApiOperation({ summary: 'Reject moderation access request' })
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReviewModerationRequestDto,
  ) {
    const data = await this.moderationService.reviewModerationRequest(
      id,
      user.userId,
      false,
      dto.note,
    );

    return new BaseResponseDto(data, 'Moderation request rejected successfully');
  }
}
