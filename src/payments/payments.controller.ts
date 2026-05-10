import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type AuthUser from '../auth/dto/auth-user';
import type { Response } from 'express';
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { InitiateSubscriptionPaymentDto } from './dto/initiate-subscription-payment.dto';
import { PaymentsService } from './payments.service';
import { MyFatoorahWebhookDto } from './dto/myfatoorah-webhook.dto';
import { FilterPaymentRecordDto } from './dto/filter-payment-record.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Get()
  async findAll(@Query() filters: FilterPaymentRecordDto) {
    const { page, limit, ...userFilters } = filters;
    const pagination = { page, limit };
    const users = await this.paymentsService.findAll(pagination, userFilters);
    return new BaseResponseDto(users, 'Users retrieved successfully');
  }

  @Post('subscription-package/:packageId/records')
  @ApiOperation({ summary: 'Save a payment record for the current user' })
  @ApiResponse({ status: 201, description: 'Payment record saved successfully' })
  async savePaymentRecord(
    @CurrentUser() authUser: AuthUser,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Body() dto: CreatePaymentRecordDto,
  ) {
    const result = await this.paymentsService.savePaymentRecord(
      authUser.userId,
      packageId,
      dto,
    );

    return new BaseResponseDto(result, 'Payment record saved successfully');
  }

  @Get('records/:recordId/invoice')
  @ApiOperation({ summary: 'Download invoice PDF for a payment record' })
  @ApiResponse({ status: 200, description: 'Invoice PDF downloaded successfully' })
  async downloadPaymentRecordInvoice(
    @CurrentUser() authUser: AuthUser,
    @Param('recordId', new ParseUUIDPipe()) recordId: string,
    @Res() res: Response,
  ) {
    const invoice = await this.paymentsService.getPaymentRecordInvoice(
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

  @Post('subscription-package/:packageId/initiate')
  @ApiOperation({ summary: 'Initiate a subscription package payment' })
  @ApiResponse({ status: 201, description: 'Payment initiated successfully' })
  async initiateSubscriptionPayment(
    @CurrentUser() authUser: AuthUser,
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Body() dto: InitiateSubscriptionPaymentDto,
  ) {
    const result = await this.paymentsService.initiateSubscriptionPayment(
      authUser.userId,
      packageId,
      dto,
    );

    return new BaseResponseDto(result, 'Payment initiated successfully');
  }

  @Get(':paymentId/status')
  @ApiOperation({ summary: 'Get current payment status' })
  async getPaymentStatus(
    @CurrentUser() authUser: AuthUser,
    @Param('paymentId', new ParseUUIDPipe()) paymentId: string,
  ) {
    const result = await this.paymentsService.getPaymentStatus(
      paymentId,
      authUser.userId,
    );
    return new BaseResponseDto(result, 'Payment status retrieved successfully');
  }

  @Post(':paymentId/recheck')
  @ApiOperation({ summary: 'Recheck current payment with MyFatoorah' })
  async recheckPayment(
    @CurrentUser() authUser: AuthUser,
    @Param('paymentId', new ParseUUIDPipe()) paymentId: string,
  ) {
    const result = await this.paymentsService.recheckPayment(
      paymentId,
      authUser.userId,
    );
    return new BaseResponseDto(result, 'Payment rechecked successfully');
  }

  @Get('me/subscription')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getCurrentSubscription(@CurrentUser() authUser: AuthUser) {
    const result = await this.paymentsService.getCurrentUserSubscription(
      authUser.userId,
    );
    return new BaseResponseDto(
      result,
      'Current subscription retrieved successfully',
    );
  }

  @Public()
  @Post('webhooks/myfatoorah')
  @ApiOperation({ summary: 'Receive MyFatoorah webhook notifications' })
  async handleMyFatoorahWebhook(
    @Body() dto: MyFatoorahWebhookDto,
    @Headers('myfatoorah-signature') signature?: string,
  ) {
    console.log('webhooks/myfatoorah', { dto, signature });

    const result = await this.paymentsService.processWebhook(
      dto,
      signature,
    );
    return new BaseResponseDto(result, 'Webhook processed successfully');
  }
}
