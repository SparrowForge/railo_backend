import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from './common/dto/base-response.dto';

@ApiTags('Health')
@Controller('api/v1/health')
export class AppController {
  constructor() { }

  @Get()
  @ApiOperation({ summary: 'Check API health' })
  getHealth(): BaseResponseDto<{ status: string }> {
    return new BaseResponseDto({ status: 'ok' }, 'API is healthy');
  }
}
