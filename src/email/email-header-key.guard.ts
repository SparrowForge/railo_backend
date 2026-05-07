import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class EmailHeaderKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const headerKey = request.header('x-email-key');
    const configuredKey = this.configService.get<string>('EMAIL_SEND_HEADER_KEY');

    if (!configuredKey || headerKey !== configuredKey) {
      throw new UnauthorizedException('Invalid email header key');
    }

    return true;
  }
}
