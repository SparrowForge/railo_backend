/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from './common/dto/base-response.dto';
import { ConfigService } from '@nestjs/config';

@ApiTags('Health')
@Controller('api/v1/health')
export class AppController {
  constructor(private configService: ConfigService) { }

  @Get()
  @ApiOperation({ summary: 'Check API health' })
  getHealth(): BaseResponseDto<{ status: string }> {
    return new BaseResponseDto({ status: 'ok' }, 'API is healthy');
  }

  // @Get('config')
  // @ApiOperation({ summary: 'Check API health' })
  // getConfig(): BaseResponseDto<any> {
  //   return new BaseResponseDto({ dbHost: this.configService.get('DB_HOST') }, 'Config fetched successfully');
  // }
}
