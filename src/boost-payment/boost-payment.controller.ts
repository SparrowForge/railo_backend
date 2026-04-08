import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type AuthUser from '../auth/dto/auth-user';
import type { Response } from 'express';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApplyBoostBalanceDto } from './dto/apply-boost-balance.dto';
import { CreateBoostPaymentRecordDto } from './dto/create-boost-payment-record.dto';
import { BoostPaymentService } from './boost-payment.service';

@ApiTags('Boost Payment')
@ApiBearerAuth()
@Controller('api/v1/boost-payment')
export class BoostPaymentController {
  constructor(private readonly boostPaymentService: BoostPaymentService) { }

  @Get('records/:recordId/invoice')
  @ApiOperation({ summary: 'Download invoice PDF for a boost payment record' })
  @ApiResponse({ status: 200, description: 'Boost invoice PDF downloaded successfully' })
  async downloadBoostPaymentRecordInvoice(
    @CurrentUser() authUser: AuthUser,
    @Param('recordId', new ParseUUIDPipe()) recordId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.boostPaymentService.getPaymentRecordInvoice(
      recordId,
      authUser.userId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.fileName}"`,
    );

    res.send(invoice.buffer);
  }

  @Post('boost-package/:postId/:packageId/records')
  @ApiOperation({ summary: 'Save a boost payment record for the current user' })
  @ApiResponse({ status: 201, description: 'Boost payment record saved successfully' })
  async savePaymentRecord(
    @CurrentUser() authUser: AuthUser,
    @Param('postId', new ParseUUIDPipe()) postId: string,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Body() dto: CreateBoostPaymentRecordDto,
  ) {
    dto.postId = postId;
    const result = await this.boostPaymentService.savePaymentRecord(
      authUser.userId,
      packageId,
      dto,
    );

    return new BaseResponseDto(result, 'Boost payment record saved successfully');
  }

  @Post('records/:recordId/use')
  @ApiOperation({ summary: 'Use remaining purchased boosts for a post' })
  @ApiResponse({ status: 201, description: 'Remaining boosts applied successfully' })
  async applyRemainingBoost(
    @CurrentUser() authUser: AuthUser,
    @Param('recordId', new ParseUUIDPipe()) recordId: string,
    @Body() dto: ApplyBoostBalanceDto,
  ) {
    const result = await this.boostPaymentService.applyRemainingBoost(
      authUser.userId,
      recordId,
      dto,
    );

    return new BaseResponseDto(result, 'Remaining boosts applied successfully');
  }
}
