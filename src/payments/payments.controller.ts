import {
  Body,
  Controller,
  Get,
  Headers,
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
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type AuthUser from '../auth/dto/auth-user';
import { InitiateSubscriptionPaymentDto } from './dto/initiate-subscription-payment.dto';
import { PaymentsService } from './payments.service';
import { MyFatoorahWebhookDto } from './dto/myfatoorah-webhook.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

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
