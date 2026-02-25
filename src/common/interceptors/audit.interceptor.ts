/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

// Extend Request interface to include user property
interface RequestWithUser extends Request {
  user?: unknown;
}

export interface AuditLogData {
  userId?: string;
  username?: string;
  action: string;
  resource: string;
  resourceId?: string | number;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  requestBody?: unknown;
  responseStatus: number;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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

    // Extract user information from JWT payload (safely cast unknown -> record)
    const user = request.user as Record<string, unknown> | undefined;
    const userId = (user?.sub as string | undefined) || (user?.id as string | undefined);
    const username = (user?.username as string | undefined) || (user?.email as string | undefined);

    // Determine action and resource from request
    const req = request as unknown as Record<string, unknown> & Request;
    const method = req.method ?? 'UNKNOWN';
    const url = req.url ?? 'UNKNOWN';
    const body = (req.body as unknown) || {};
    const ip = req.ip ?? (request.socket?.remoteAddress as string) ?? 'unknown';
    const headers = (req.headers as Record<string, unknown>) || {};
    const action = this.getAction(method);
    const resource = this.getResource(url);
    const resourceId = this.getResourceId(url, body);

    // Normalize user-agent to a string for logging
    const rawUserAgent = headers['user-agent'];
    let userAgent = 'unknown';
    if (typeof rawUserAgent === 'string') {
      userAgent = rawUserAgent;
    } else if (rawUserAgent !== undefined) {
      try {
        userAgent = JSON.stringify(rawUserAgent);
      } catch {
        if (typeof rawUserAgent === 'number' || typeof rawUserAgent === 'boolean') {
          userAgent = String(rawUserAgent);
        } else {
          userAgent = '[object]';
        }
      }
    }

    const auditData: AuditLogData = {
      userId,
      username,
      action,
      resource,
      resourceId,
      method,
      url,
      ip: ip,
      userAgent,
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
        this.logAuditEvent({ ...auditData, resourceId: updatedResourceId });
      }),
      catchError((error) => {
        const endTime = Date.now();
        auditData.responseTime = endTime - startTime;
        auditData.responseStatus = error.status || 500;
        auditData.success = false;
        auditData.error = error.message;

        this.logAuditEvent(auditData);
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
    // Normalize resource extraction to skip api and version segments
    const pathOnly = url.split('?')[0];
    const parts = pathOnly.split('/').filter(Boolean);
    let index = 0;
    if (parts[index] && parts[index].toLowerCase() === 'api') index++;
    if (parts[index] && /^v\d+$/i.test(parts[index])) index++;
    return parts[index] || 'unknown';
  }

  private getResourceId(url: string, body: unknown): string | number | undefined {
    // Try to get ID from URL params first
    const urlMatch = url.match(/\/(\d+)(?:\/|$)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    // Try to get ID from request body
    if (body && typeof body === 'object' && 'id' in (body as Record<string, unknown>)) {
      return (body as Record<string, unknown>)['id'] as string | number;
    }

    return undefined;
  }

  private extractResourceIdFromResponse(data: unknown): string | number | undefined {
    if (!data) return undefined;
    const asRecord = data as Record<string, unknown>;
    const payload = asRecord['data'] ?? data;
    if (!payload) return undefined;
    if (typeof payload === 'object' && payload !== null && 'id' in (payload as Record<string, unknown>))
      return (payload as Record<string, unknown>)['id'] as string | number;
    const p = payload as Record<string, unknown>;
    if (p?.items && Array.isArray(p.items) && (p.items as any)[0]?.id)
      return ((p.items as any)[0].id) as string | number;
    return undefined;
  }

  private sanitizeRequestBody(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object' || body === null) return undefined;

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized: Record<string, unknown> = { ...(body as Record<string, unknown>) };

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private logAuditEvent(auditData: AuditLogData): void {
    const logMessage = `AUDIT: ${auditData.action} ${auditData.resource}${auditData.resourceId ? `:${auditData.resourceId}` : ''} by ${auditData.username || 'anonymous'} (${auditData.responseStatus}) - ${auditData.responseTime}ms`;

    if (auditData.success) {
      this.logger.log(logMessage);
    } else {
      this.logger.error(logMessage);
    }

    // Save to database asynchronously
    // this.saveToDatabase(auditData).catch((error) => {
    //   this.logger.error(`Failed to save audit log: ${error.message}`);
    // });
  }

  private async saveToDatabase(auditData: AuditLogData): Promise<void> {
    try {
      await this.auditService.createAuditLog(auditData);
    } catch (error) {
      this.logger.error(`Failed to save audit log: ${error.message}`);
      // Don't throw error to avoid breaking the main request flow
    }
  }
}
