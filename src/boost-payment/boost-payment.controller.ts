import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type AuthUser from '../auth/dto/auth-user';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBoostPaymentRecordDto } from './dto/create-boost-payment-record.dto';
import { BoostPaymentService } from './boost-payment.service';

@ApiTags('Boost Payment')
@ApiBearerAuth()
@Controller('api/v1/boost-payment')
export class BoostPaymentController {
  constructor(private readonly boostPaymentService: BoostPaymentService) { }

  @Post('boost-package/:packageId/records')
  @ApiOperation({ summary: 'Save a boost payment record for the current user' })
  @ApiResponse({ status: 201, description: 'Boost payment record saved successfully' })
  async savePaymentRecord(
    @CurrentUser() authUser: AuthUser,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Body() dto: CreateBoostPaymentRecordDto,
  ) {
    const result = await this.boostPaymentService.savePaymentRecord(
      authUser.userId,
      packageId,
      dto,
    );

    return new BaseResponseDto(result, 'Boost payment record saved successfully');
  }
}
