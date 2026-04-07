import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';

type MyFatoorahEnvelope<T> = {
  IsSuccess?: boolean;
  Message?: string;
  Data?: T;
  ValidationErrors?: unknown[];
};

type MyFatoorahInitiatePaymentData = {
  PaymentMethods?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

type MyFatoorahExecutePaymentData = {
  InvoiceId?: number | string;
  PaymentURL?: string;
  PaymentId?: string;
} & Record<string, unknown>;

type MyFatoorahPaymentStatusData = Record<string, unknown>;

@Injectable()
export class MyFatoorahService {
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('MYFATOORAH_BASE_URL') ||
      'https://apitest.myfatoorah.com';

    this.client = axios.create({
      baseURL: baseURL.replace(/\/+$/, ''),
      headers: {
        Authorization: `Bearer ${this.getRequiredConfig('MYFATOORAH_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });
  }

  getCurrency(): string {
    return this.configService.get<string>('MYFATOORAH_CURRENCY') || 'KWD';
  }

  getCallbackUrl(): string | undefined {
    return this.configService.get<string>('MYFATOORAH_CALLBACK_URL');
  }

  getErrorUrl(): string | undefined {
    return this.configService.get<string>('MYFATOORAH_ERROR_URL');
  }

  getDefaultPaymentMethodId(): number | undefined {
    const rawValue = this.configService.get<string>(
      'MYFATOORAH_PAYMENT_METHOD_ID',
    );

    if (!rawValue) {
      return undefined;
    }

    const parsed = Number(rawValue);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  async initiatePayment(invoiceAmount: number, currencyIso: string) {
    return this.post<MyFatoorahInitiatePaymentData>('/v2/InitiatePayment', {
      InvoiceAmount: invoiceAmount,
      CurrencyIso: currencyIso,
    });
  }

  async executePayment(params: {
    invoiceValue: number;
    paymentMethodId: number;
    customerName?: string;
    customerEmail?: string;
    customerMobile?: string;
    language?: string;
    customerReference: string;
    userDefinedField?: string;
  }) {
    const body: Record<string, unknown> = {
      PaymentMethodId: params.paymentMethodId,
      InvoiceValue: params.invoiceValue,
      CustomerName: params.customerName,
      CustomerEmail: params.customerEmail,
      CustomerMobile: params.customerMobile,
      Language: (params.language || 'en').toUpperCase(),
      CustomerReference: params.customerReference,
      UserDefinedField: params.userDefinedField,
    };

    const callbackUrl = this.getCallbackUrl();
    const errorUrl = this.getErrorUrl();

    if (callbackUrl) {
      body.CallBackUrl = callbackUrl;
    }

    if (errorUrl) {
      body.ErrorUrl = errorUrl;
    }

    return this.post<MyFatoorahExecutePaymentData>('/v2/ExecutePayment', body);
  }

  async getPaymentStatus(key: string, keyType: 'InvoiceId' | 'PaymentId') {
    return this.post<MyFatoorahPaymentStatusData>('/v2/GetPaymentStatus', {
      Key: key,
      KeyType: keyType,
    });
  }

  verifyWebhookSignature(
    payload: Record<string, unknown>,
    signatureHeader?: string,
  ): boolean {
    const secret = this.configService.get<string>('MYFATOORAH_WEBHOOK_SECRET');

    if (!secret) {
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const actual = signatureHeader.trim().toLowerCase();
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const actualBuffer = Buffer.from(actual, 'utf8');

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new BadRequestException(`${key} is not configured`);
    }
    return value;
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
  ): Promise<MyFatoorahEnvelope<T>> {
    try {
      const { data } = await this.client.post<MyFatoorahEnvelope<T>>(path, body);

      if (data?.IsSuccess === false) {
        throw new BadGatewayException(
          data.Message || 'MyFatoorah request failed',
        );
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { Message?: string } | undefined)?.Message ||
          error.message;
        throw new BadGatewayException(
          `MyFatoorah request failed: ${message}`,
        );
      }

      throw error;
    }
  }
}
