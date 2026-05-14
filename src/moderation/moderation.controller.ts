import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type AuthUser from '../auth/dto/auth-user';
import { ModerationUserGuard } from './guards/moderation-user.guard';
import { FilterModerationCaseDto } from './dto/filter-moderation-case.dto';
import { PerformModerationActionDto } from './dto/perform-moderation-action.dto';
import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@UseGuards(ModerationUserGuard)
@Controller('api/v1/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) { }

  @Get('cases')
  @ApiOperation({ summary: 'List moderation cases' })
  async listCases(@Query() filters: FilterModerationCaseDto) {
    const { page, limit, ...rest } = filters;
    const data = await this.moderationService.listCases({
      page,
      limit,
      ...rest,
    });

    return new BaseResponseDto(data, 'Moderation cases retrieved successfully');
  }

  @Get('cases/:id')
  @ApiOperation({ summary: 'Get a moderation case with evidence' })
  async getCase(@Param('id') id: string) {
    const data = await this.moderationService.getCase(id);
    return new BaseResponseDto(data, 'Moderation case retrieved successfully');
  }

  @Post('cases/:id/claim')
  @ApiOperation({ summary: 'Claim a moderation case for review' })
  async claimCase(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const data = await this.moderationService.claimCase(id, user.userId);
    return new BaseResponseDto(data, 'Moderation case claimed successfully');
  }

  @Post('cases/:id/actions')
  @ApiOperation({ summary: 'Apply a moderation action' })
  async performAction(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: PerformModerationActionDto,
  ) {
    const data = await this.moderationService.performAction(
      id,
      user.userId,
      dto.actionType,
      dto.note,
    );
    return new BaseResponseDto(data, 'Moderation action applied successfully');
  }

  @Get('status')
  @ApiOperation({ summary: 'Get moderation status' })
  async stats() {
    const data = await this.moderationService.getStatus();
    return new BaseResponseDto(data, 'Moderation stats retrieved successfully');
  }

  @Get('user-moderation-points/:userId')
  @ApiOperation({ summary: 'Get user moderation points' })
  async getUserModerationPoints(@Param('userId') userId: string) {
    const data = await this.moderationService.getUserModerationPoints(userId);
    return new BaseResponseDto(data, 'User moderation points retrieved successfully');
  }

  @Post('set-threshold-points')
  @ApiOperation({ summary: 'Set moderation point threshold' })
  async setModerationPointThreshold(@Body() { points }: { points: number }, @CurrentUser() user: AuthUser) {
    const data = await this.moderationService.setModerationPointThreshold(points, user.userId);
    return new BaseResponseDto(data, 'Moderation point threshold set successfully');
  }
}
