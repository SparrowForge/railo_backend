/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { AuditService } from '../../audits/audits.service';
import { AuditLogData } from './audit.interceptor';

// Extend Request interface to include user property
interface RequestWithUser extends Request {
  user?: any;
}

@Injectable()
export class AuditDatabaseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditDatabaseInterceptor.name);

  constructor(private readonly auditService: AuditService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Skip auditing for non-HTTP contexts (like CLI commands, seed operations)
    if (context.getType() !== 'http') {
      return next.handle();
    }

    // Skip auditing during seed operations
    if (process.argv.includes('seed') || process.argv.includes('cli.ts')) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // Extract user information from JWT payload
    const user = request.user;
    const userId = user?.sub || user?.id || user?.userId;
    const username = user?.username || user?.email;

    // Determine action and resource from request
    const req: any = request;
    const method = req.method || 'UNKNOWN';
    const url = req.url || 'UNKNOWN';
    const body = req.body || {};
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const headers = req.headers || {};
    const action = this.getAction(method);
    const resource = this.getResource(url);
    const resourceId = this.getResourceId(url, body);

    const auditData: AuditLogData = {
      userId,
      username,
      action,
      resource,
      resourceId,
      method,
      url,
      ip: ip,
      userAgent: headers['user-agent'] || 'unknown',
      requestBody: this.sanitizeRequestBody(body),
      responseStatus: 0,
      responseTime: 0,
      timestamp: new Date(),
      success: false,
    };

    return next.handle().pipe(
      tap((data) => {
        const endTime = Date.now();
        auditData.responseTime = endTime - startTime;
        auditData.responseStatus = response.statusCode;
        auditData.success = response.statusCode < 400;

        const updatedResourceId =
          this.extractResourceIdFromResponse(data) ?? auditData.resourceId;

        // this.logAuditEvent({ ...auditData, resourceId: updatedResourceId });
      }),
      catchError((error) => {
        const endTime = Date.now();
        auditData.responseTime = endTime - startTime;
        auditData.responseStatus = error.status || 500;
        auditData.success = false;
        auditData.error = error.message;

        // this.logAuditEvent(auditData);
        throw error;
      }),
    );
  }

  private getAction(method: string): string {
    const actionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return actionMap[method] || 'UNKNOWN';
  }

  private getResource(url: string): string {
    // Extract resource from URL path, skipping api prefix and version segment
    const pathOnly = url.split('?')[0];
    const parts = pathOnly.split('/').filter(Boolean); // removes empty and leading '/'
    let index = 0;
    if (parts[index] && parts[index].toLowerCase() === 'api') index++;
    if (parts[index] && /^v\d+$/i.test(parts[index])) index++;
    return parts[index] || 'unknown';
  }

  private getResourceId(url: string, body: any): string | number | undefined {
    // Try to get ID from URL params first
    const urlMatch = url.match(/\/(\d+)(?:\/|$)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Try to get ID from request body
    if (body?.id) {
      return body.id;
    }

    return undefined;
  }

  private extractResourceIdFromResponse(
    data: any,
  ): string | number | undefined {
    if (!data) return undefined;
    // Expect BaseResponseDto shape: { data: ... }
    const payload = data.data ?? data;
    if (!payload) return undefined;
    if (typeof payload === 'object' && 'id' in payload) {
      return payload.id;
    }
    // In case of list
    if (
      payload?.items &&
      Array.isArray(payload.items) &&
      payload.items[0]?.id
    ) {
      return payload.items[0].id;
    }
    return undefined;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // private async logAuditEvent(auditData: AuditLogData): Promise<void> {
  //   try {
  //     const logMessage = `AUDIT: ${auditData.action} ${auditData.resource}${auditData.resourceId ? `:${auditData.resourceId}` : ''} by ${auditData.username || 'anonymous'} (${auditData.responseStatus}) - ${auditData.responseTime}ms`;

  //     if (auditData.success) {
  //       this.logger.log(logMessage);
  //     } else {
  //       this.logger.error(logMessage);
  //     }

  //     // Save to database
  //     await this.auditService.createAuditLog(auditData);
  //   } catch (error) {
  //     this.logger.error(`Failed to save audit log: ${error.message}`);
  //     // Don't throw error to avoid breaking the main request
  //   }
  // }
}
