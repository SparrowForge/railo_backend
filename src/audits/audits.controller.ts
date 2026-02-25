import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AuditService } from './audits.service';
import { FilterAuditDto } from './dto/filter-audit.dto';
import { AuditLog } from './entities/audit.entity';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/audits')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get()
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve paginated audit logs with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: BaseResponseDto<PaginatedResponseDto<AuditLog>>,
    schema: {
      example: {
        success: true,
        message: 'Audit logs retrieved successfully',
        data: {
          items: [
            {
              id: 1,
              userId: 1,
              username: 'John Doe',
              action: 'CREATE',
              resource: 'users',
              resourceId: '1',
              success: true,
              createdAt: '2024-03-14T12:00:00.000Z',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        timestamp: '2024-03-14T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Query() filterAuditDto: FilterAuditDto,
  ): Promise<BaseResponseDto<PaginatedResponseDto<AuditLog>>> {
    const { page = 1, limit = 50, ...filters } = filterAuditDto;
    const pagination = { page, limit };

    const result = await this.auditService.findAll(pagination, filters);

    return new BaseResponseDto(
      {
        items: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNextPage: result.page < Math.ceil(result.total / result.limit),
          hasPreviousPage: result.page > 1,
        },
      },
      'Audit logs retrieved successfully',
    );
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get audit statistics',
    description:
      'Retrieve audit statistics including action counts, response times, and top users/resources',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BaseResponseDto<any>> {
    const stats = await this.auditService.getAuditStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return new BaseResponseDto(
      stats,
      'Audit statistics retrieved successfully',
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Retrieve a specific audit log entry by its ID',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Audit log ID' })
  @ApiResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BaseResponseDto<AuditLog>> {
    const auditLog = await this.auditService.findById(id);

    return new BaseResponseDto(auditLog, 'Audit log retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get audit logs by user',
    description: 'Retrieve audit logs for a specific user',
  })
  @ApiParam({ name: 'userId', type: Number, description: 'User ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of logs to return',
  })
  @ApiResponse({
    status: 200,
    description: 'User audit logs retrieved successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByUser(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<BaseResponseDto<AuditLog[]>> {
    const auditLogs = await this.auditService.findByUser(userId, limit);

    return new BaseResponseDto(
      auditLogs,
      'User audit logs retrieved successfully',
    );
  }

  @Get('resource/:resource')
  @ApiOperation({
    summary: 'Get audit logs by resource',
    description: 'Retrieve audit logs for a specific resource type',
  })
  @ApiParam({
    name: 'resource',
    type: String,
    description: 'Resource type (e.g., users, panels, branches)',
  })
  @ApiQuery({
    name: 'resourceId',
    required: false,
    type: String,
    description: 'Specific resource ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Resource audit logs retrieved successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByResource(
    @Param('resource') resource: string,
    @Query('resourceId') resourceId?: string,
  ): Promise<BaseResponseDto<AuditLog[]>> {
    const auditLogs = await this.auditService.findByResource(
      resource,
      resourceId,
    );

    return new BaseResponseDto(
      auditLogs,
      'Resource audit logs retrieved successfully',
    );
  }

  @Post('cleanup')
  @ApiOperation({
    summary: 'Clean up old audit logs',
    description:
      'Delete audit logs older than specified days (default: 90 days)',
  })
  @ApiQuery({
    name: 'daysToKeep',
    required: false,
    type: Number,
    description: 'Number of days to keep logs',
  })
  @ApiResponse({
    status: 200,
    description: 'Old audit logs cleaned up successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupOldLogs(
    @Query('daysToKeep', new DefaultValuePipe(90), ParseIntPipe)
    daysToKeep: number,
  ): Promise<BaseResponseDto<{ deletedCount: number }>> {
    const deletedCount = await this.auditService.cleanupOldLogs(daysToKeep);

    return new BaseResponseDto(
      { deletedCount },
      `Cleaned up ${deletedCount} old audit logs`,
    );
  }
}
