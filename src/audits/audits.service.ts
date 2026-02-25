/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditLogData } from '../common/interceptors/audit.interceptor';
import { AuditLog } from './entities/audit.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) { }

  async createAuditLog(auditData: AuditLogData): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: auditData.userId,
        username: auditData.username,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId?.toString(),
        method: auditData.method,
        url: auditData.url,
        ip: auditData.ip,
        userAgent: auditData.userAgent,
        requestBody: auditData.requestBody,
        responseStatus: auditData.responseStatus,
        responseTime: auditData.responseTime,
        success: auditData.success,
        error: auditData.error,
        timestamp: auditData.timestamp,
      });

      const saved = await this.auditLogRepository.save(auditLog);
      this.logger.debug(`Audit log saved: ${JSON.stringify(saved)}`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${error?.message ?? ''}`);
      throw error;
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<{
      search?: string;
      resourceId?: string;
      targetDays?: string;

      // userId?: number;
      // username?: string;
      // action?: string;
      // resource?: string;
      // resourceId?: string;
      // method?: string;
      // ip?: string;
      // responseStatus?: number;
      // success?: boolean;
      // startDate?: Date;
      // endDate?: Date;
    }>,
  ): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    // Apply filters
    if (filters?.search && filters?.search !== '') {
      queryBuilder.andWhere(
        'audit.username LIKE :search or audit.action LIKE :search',
        {
          search: `%${filters.search}%`,
        },
      );
    }
    if (filters?.resourceId && Number(filters?.resourceId) > 0) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', {
        resourceId: filters.resourceId,
      });
    }
    if (filters?.targetDays && Number(filters?.targetDays) > -1) {
      const start_date = new Date();
      start_date.setDate(start_date.getDate() - Number(filters?.targetDays));
      const end_date = new Date();
      queryBuilder.andWhere(
        'audit.timestamp BETWEEN :start_date AND :end_date',
        {
          start_date: start_date,
          end_date: end_date,
        },
      );
    }

    // if (filters?.userId) {
    //   queryBuilder.andWhere('audit.userId = :userId', {
    //     userId: filters.userId,
    //   });
    // }

    // if (filters?.username) {
    //   queryBuilder.andWhere('audit.username LIKE :username', {
    //     username: `%${filters.username}%`,
    //   });
    // }

    // if (filters?.action) {
    //   queryBuilder.andWhere('audit.action = :action', {
    //     action: filters.action,
    //   });
    // }

    // if (filters?.resource) {
    //   queryBuilder.andWhere('audit.resource = :resource', {
    //     resource: filters.resource,
    //   });
    // }

    // if (filters?.method) {
    //   queryBuilder.andWhere('audit.method = :method', {
    //     method: filters.method,
    //   });
    // }

    // if (filters?.ip) {
    //   queryBuilder.andWhere('audit.ip = :ip', {
    //     ip: filters.ip,
    //   });
    // }

    // if (filters?.responseStatus) {
    //   queryBuilder.andWhere('audit.responseStatus = :responseStatus', {
    //     responseStatus: filters.responseStatus,
    //   });
    // }

    // if (filters?.success !== undefined) {
    //   queryBuilder.andWhere('audit.success = :success', {
    //     success: filters.success,
    //   });
    // }

    // Order by timestamp descending (newest first)
    queryBuilder.orderBy('audit.timestamp', 'DESC');

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<AuditLog> {
    return this.auditLogRepository.findOneOrFail({ where: { id } });
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async findByResource(
    resource: string,
    resourceId?: string,
  ): Promise<AuditLog[]> {
    const where: any = { resource };
    if (resourceId) {
      where.resourceId = resourceId;
    }

    return this.auditLogRepository.find({
      where,
      order: { timestamp: 'DESC' },
    });
  }

  async getAuditStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalActions: number;
    uniqueUsers: number;
    systemEvents: number;
    successfulActions: number;
    errorEvents: number;
    averageResponseTime: number;
    topActiveUsers: Array<{ username: string; actionCount: number }>;
    activityByCategory: Array<{ resource: string; actionCount: number }>;
    systemHealth: number;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');
    const systemEventsQueryBuilder =
      this.auditLogRepository.createQueryBuilder('audit');
    const activityByCategoryQueryBuilder =
      this.auditLogRepository.createQueryBuilder('audit');

    if (startDate && endDate) {
      queryBuilder.where('audit.timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
      systemEventsQueryBuilder.where(
        'audit.timestamp BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
      activityByCategoryQueryBuilder.where(
        'audit.timestamp BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    // Total actions
    const totalActions = await queryBuilder.getCount();

    // Successful actions
    const successfulActions = await queryBuilder
      .andWhere('audit.success = :success', { success: true })
      .getCount();

    // Failed actions
    const errorEvents = totalActions - successfulActions;

    //uniqueUsers
    const uniqueUsers = await queryBuilder
      .select('COUNT(DISTINCT audit.username)', 'total_users')
      .getRawOne();

    //systemEvents
    const systemEvents = await systemEventsQueryBuilder
      .select('COUNT(*)', 'system_events')
      .where("audit.action NOT IN ('CREATE', 'READ', 'UPDATE', 'DELETE')")
      .getRawOne();

    // Average response time
    const avgResponseTimeResult = await activityByCategoryQueryBuilder
      .select('AVG(audit.responseTime)', 'avgResponseTime')
      .getRawOne();
    const averageResponseTime = parseFloat(
      avgResponseTimeResult?.avgResponseTime || '0',
    );

    // Top users
    const topActiveUsers = await queryBuilder
      .select('audit.username', 'username')
      .addSelect('COUNT(*)', 'action_count')
      .groupBy('audit.username')
      .orderBy('action_count', 'DESC')
      .limit(10)
      .getRawMany();

    // Top resources
    const activityByCategory = await queryBuilder
      .select('audit.resource', 'resource')
      .addSelect('COUNT(*)', 'action_count')
      .groupBy('audit.resource')
      .orderBy('action_count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalActions,
      uniqueUsers: parseInt(uniqueUsers?.total_users || '0'),
      systemEvents: parseInt(systemEvents?.system_events || '0'),
      successfulActions,
      errorEvents,
      averageResponseTime,
      topActiveUsers: topActiveUsers.map((user) => ({
        username: user.username || 'anonymous',
        actionCount: parseInt(user.action_count),
      })),
      activityByCategory: activityByCategory.map((resource) => ({
        resource: resource.resource,
        actionCount: parseInt(resource.action_count),
      })),
      systemHealth: 78,
    };
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    const deletedCount = result.affected || 0;
    this.logger.log(
      `Cleaned up ${deletedCount} audit logs older than ${daysToKeep} days`,
    );

    return deletedCount;
  }
}
