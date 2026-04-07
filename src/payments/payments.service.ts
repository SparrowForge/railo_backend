import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPackage } from '../subscription-package/entities/subscription-package.entity';
import { User } from '../users/entities/user.entity';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { SubscriptionPaymentStatus } from './enums/subscription-payment-status.enum';
import { UserSubscriptionStatus } from './enums/user-subscription-status.enum';
import { InitiateSubscriptionPaymentDto } from './dto/initiate-subscription-payment.dto';
import { MyFatoorahService } from './myfatoorah.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(SubscriptionPayment)
    private readonly subscriptionPaymentRepository: Repository<SubscriptionPayment>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPackage)
    private readonly subscriptionPackageRepository: Repository<SubscriptionPackage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly myFatoorahService: MyFatoorahService,
  ) {}

  async initiateSubscriptionPayment(
    userId: string,
    packageId: string,
    dto: InitiateSubscriptionPaymentDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscriptionPackage = await this.subscriptionPackageRepository.findOne({
      where: { id: packageId },
      relations: ['benifits'],
    });

    if (!subscriptionPackage || !subscriptionPackage.isActive) {
      throw new BadRequestException('Active subscription package not found');
    }

    const amount = this.getPackageAmount(subscriptionPackage);
    const currency = this.myFatoorahService.getCurrency();

    const payment = await this.subscriptionPaymentRepository.save(
      this.subscriptionPaymentRepository.create({
        user_id: userId,
        subscription_package_id: subscriptionPackage.id,
        amount,
        currency,
        status: SubscriptionPaymentStatus.created,
        provider: 'myfatoorah',
      }),
    );

    const initiateResponse = await this.myFatoorahService.initiatePayment(
      amount,
      currency,
    );

    const paymentMethods = initiateResponse.Data?.PaymentMethods || [];

    const paymentMethodId =
      dto.paymentMethodId ||
      this.myFatoorahService.getDefaultPaymentMethodId() ||
      Number(paymentMethods[0]?.PaymentMethodId);

    if (!paymentMethodId) {
      throw new BadRequestException(
        'No MyFatoorah payment method is available for this invoice',
      );
    }

    const executeResponse = await this.myFatoorahService.executePayment({
      invoiceValue: amount,
      paymentMethodId,
      customerName: user.display_name || user.name,
      customerEmail: user.email,
      customerMobile: user.phone_no,
      language: dto.language,
      customerReference: payment.id,
      userDefinedField: subscriptionPackage.id,
    });

    const executeData = executeResponse.Data || {};

    const updatedPayment = await this.subscriptionPaymentRepository.save({
      ...payment,
      status: SubscriptionPaymentStatus.initiated,
      myfatoorah_invoice_id: this.readString(executeData, 'InvoiceId'),
      myfatoorah_payment_id: this.extractPaymentId(executeData),
      gateway_response: {
        initiate: initiateResponse,
        execute: executeResponse,
      },
    });

    return {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      paymentMethodId,
      package: subscriptionPackage,
      myfatoorah: {
        invoiceId: updatedPayment.myfatoorah_invoice_id,
        paymentId: updatedPayment.myfatoorah_payment_id,
        paymentUrl: this.readString(executeData, 'PaymentURL'),
        paymentMethods,
      },
    };
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.findOwnedPayment(paymentId, userId);

    if (
      payment.status === SubscriptionPaymentStatus.created ||
      payment.status === SubscriptionPaymentStatus.initiated ||
      payment.status === SubscriptionPaymentStatus.pending
    ) {
      await this.recheckPayment(payment.id, userId);
    }

    return this.getPaymentDetails(paymentId, userId);
  }

  async recheckPayment(paymentId: string, userId: string) {
    const payment = await this.findOwnedPayment(paymentId, userId);
    return this.reconcilePayment(payment);
  }

  async processWebhook(
    payload: Record<string, unknown>,
    signatureHeader?: string,
  ) {
    if (
      !this.myFatoorahService.verifyWebhookSignature(payload, signatureHeader)
    ) {
      throw new ForbiddenException('Invalid MyFatoorah webhook signature');
    }

    const payment = await this.findPaymentFromWebhook(payload);
    if (!payment) {
      this.logger.warn('MyFatoorah webhook received for unknown payment');
      return { processed: false };
    }

    payment.webhook_payload = payload;
    await this.subscriptionPaymentRepository.save(payment);

    const reconciled = await this.reconcilePayment(payment);
    return { processed: true, paymentId: reconciled.id, status: reconciled.status };
  }

  async getCurrentUserSubscription(userId: string) {
    await this.expireSubscriptionsForUser(userId);

    return this.userSubscriptionRepository.findOne({
      where: { user_id: userId, status: UserSubscriptionStatus.active },
      relations: ['subscription_package', 'subscription_payment'],
      order: { ends_at: 'DESC' },
    });
  }

  async getPaymentDetails(paymentId: string, userId: string) {
    const payment = await this.findOwnedPayment(paymentId, userId);
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { subscription_payment_id: payment.id },
      relations: ['subscription_package'],
    });

    return {
      payment,
      subscription,
    };
  }

  private async reconcilePayment(payment: SubscriptionPayment) {
    const keyInfo = this.getStatusLookupKey(payment);
    if (!keyInfo) {
      return payment;
    }

    const statusResponse = await this.myFatoorahService.getPaymentStatus(
      keyInfo.key,
      keyInfo.keyType,
    );
    const statusData = statusResponse.Data || {};
    const normalizedStatus = this.normalizeMyFatoorahStatus(statusData);

    if (normalizedStatus === SubscriptionPaymentStatus.paid) {
      return this.markPaymentPaid(payment, statusResponse, statusData);
    }

    return this.markPaymentUnsuccessful(
      payment,
      normalizedStatus,
      statusResponse,
      statusData,
    );
  }

  private async markPaymentPaid(
    payment: SubscriptionPayment,
    response: Record<string, unknown>,
    statusData: Record<string, unknown>,
  ) {
    if (payment.status === SubscriptionPaymentStatus.paid) {
      return payment;
    }

    await this.activateSubscription(payment);

    const paidPayment = await this.subscriptionPaymentRepository.save({
      ...payment,
      status: SubscriptionPaymentStatus.paid,
      paid_at: new Date(),
      failed_at: null,
      gateway_response: {
        ...(payment.gateway_response || {}),
        status: response,
      },
      myfatoorah_invoice_reference:
        this.readString(statusData, 'InvoiceReference') ||
        this.readNestedString(statusData, ['Invoice', 'Reference']) ||
        payment.myfatoorah_invoice_reference,
      myfatoorah_payment_id:
        this.extractPaymentId(statusData) || payment.myfatoorah_payment_id,
    });

    await this.syncUserSubscriptionFlag(payment.user_id);
    return paidPayment;
  }

  private async markPaymentUnsuccessful(
    payment: SubscriptionPayment,
    status: SubscriptionPaymentStatus,
    response: Record<string, unknown>,
    statusData: Record<string, unknown>,
  ) {
    const shouldSetFailedAt =
      status === SubscriptionPaymentStatus.failed ||
      status === SubscriptionPaymentStatus.canceled ||
      status === SubscriptionPaymentStatus.expired ||
      status === SubscriptionPaymentStatus.refunded;

    return this.subscriptionPaymentRepository.save({
      ...payment,
      status,
      failed_at: shouldSetFailedAt ? payment.failed_at || new Date() : null,
      expires_at:
        status === SubscriptionPaymentStatus.expired
          ? payment.expires_at || new Date()
          : payment.expires_at,
      gateway_response: {
        ...(payment.gateway_response || {}),
        status: response,
      },
      myfatoorah_invoice_reference:
        this.readString(statusData, 'InvoiceReference') ||
        this.readNestedString(statusData, ['Invoice', 'Reference']) ||
        payment.myfatoorah_invoice_reference,
      myfatoorah_payment_id:
        this.extractPaymentId(statusData) || payment.myfatoorah_payment_id,
    });
  }

  private async activateSubscription(payment: SubscriptionPayment) {
    const existingSubscription = await this.userSubscriptionRepository.findOne({
      where: {
        user_id: payment.user_id,
        status: UserSubscriptionStatus.active,
      },
      order: { ends_at: 'DESC' },
    });

    const existingPaymentSubscription = await this.userSubscriptionRepository.findOne(
      {
        where: { subscription_payment_id: payment.id },
      },
    );

    if (existingPaymentSubscription) {
      return existingPaymentSubscription;
    }

    const subscriptionPackage = await this.subscriptionPackageRepository.findOne({
      where: { id: payment.subscription_package_id },
    });

    if (!subscriptionPackage) {
      throw new NotFoundException('Subscription package not found');
    }

    const now = new Date();
    const startsAt =
      existingSubscription && existingSubscription.ends_at > now
        ? existingSubscription.ends_at
        : now;
    const endsAt = new Date(startsAt.getTime());
    endsAt.setDate(endsAt.getDate() + subscriptionPackage.duration);

    return this.userSubscriptionRepository.save(
      this.userSubscriptionRepository.create({
        user_id: payment.user_id,
        subscription_package_id: payment.subscription_package_id,
        subscription_payment_id: payment.id,
        status: UserSubscriptionStatus.active,
        starts_at: startsAt,
        ends_at: endsAt,
      }),
    );
  }

  private async syncUserSubscriptionFlag(userId: string) {
    await this.expireSubscriptionsForUser(userId);

    const activeSubscription = await this.userSubscriptionRepository.findOne({
      where: { user_id: userId, status: UserSubscriptionStatus.active },
    });

    await this.userRepository.update(userId, {
      isSubscribedUser: Boolean(activeSubscription),
    });
  }

  private async expireSubscriptionsForUser(userId: string) {
    const expiredSubscriptions = await this.userSubscriptionRepository
      .createQueryBuilder()
      .update(UserSubscription)
      .set({ status: UserSubscriptionStatus.expired })
      .where('user_id = :userId', { userId })
      .andWhere('status = :status', { status: UserSubscriptionStatus.active })
      .andWhere('ends_at <= :now', { now: new Date() })
      .execute();

    if (expiredSubscriptions.affected) {
      await this.userRepository.update(userId, {
        isSubscribedUser: false,
      });
    }
  }

  private async findOwnedPayment(paymentId: string, userId: string) {
    const payment = await this.subscriptionPaymentRepository.findOne({
      where: { id: paymentId },
      relations: ['subscription_package'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.user_id !== userId) {
      throw new ForbiddenException('You are not allowed to access this payment');
    }

    return payment;
  }

  private async findPaymentFromWebhook(payload: Record<string, unknown>) {
    const customerReference =
      this.readString(payload, 'CustomerReference') ||
      this.readNestedString(payload, ['Data', 'CustomerReference']) ||
      this.readNestedString(payload, ['Data', 'Invoice', 'CustomerReference']);

    if (customerReference) {
      const payment = await this.subscriptionPaymentRepository.findOne({
        where: { id: customerReference },
      });
      if (payment) {
        return payment;
      }
    }

    const invoiceId =
      this.readString(payload, 'InvoiceId') ||
      this.readNestedString(payload, ['Data', 'InvoiceId']) ||
      this.readNestedString(payload, ['Data', 'Invoice', 'Id']);

    if (invoiceId) {
      return this.subscriptionPaymentRepository.findOne({
        where: { myfatoorah_invoice_id: invoiceId },
      });
    }

    const paymentId =
      this.readString(payload, 'PaymentId') ||
      this.readNestedString(payload, ['Data', 'PaymentId']);

    if (paymentId) {
      return this.subscriptionPaymentRepository.findOne({
        where: { myfatoorah_payment_id: paymentId },
      });
    }

    return null;
  }

  private getPackageAmount(subscriptionPackage: SubscriptionPackage) {
    return subscriptionPackage.discountPrice > 0
      ? subscriptionPackage.discountPrice
      : subscriptionPackage.price;
  }

  private getStatusLookupKey(
    payment: SubscriptionPayment,
  ): { key: string; keyType: 'InvoiceId' | 'PaymentId' } | null {
    if (payment.myfatoorah_invoice_id) {
      return { key: payment.myfatoorah_invoice_id, keyType: 'InvoiceId' };
    }

    if (payment.myfatoorah_payment_id) {
      return { key: payment.myfatoorah_payment_id, keyType: 'PaymentId' };
    }

    return null;
  }

  private normalizeMyFatoorahStatus(data: Record<string, unknown>) {
    const candidates = [
      this.readString(data, 'InvoiceStatus'),
      this.readString(data, 'PaymentStatus'),
      this.readNestedString(data, ['Invoice', 'Status']),
      this.readNestedString(data, ['InvoiceTransactions', '0', 'TransactionStatus']),
      this.readNestedString(data, ['InvoiceTransactions', '0', 'PaymentStatus']),
    ].filter(Boolean);

    const normalized = candidates.join(' ').toLowerCase();

    if (
      normalized.includes('paid') ||
      normalized.includes('success') ||
      normalized.includes('successful')
    ) {
      return SubscriptionPaymentStatus.paid;
    }

    if (normalized.includes('pending')) {
      return SubscriptionPaymentStatus.pending;
    }

    if (normalized.includes('cancel')) {
      return SubscriptionPaymentStatus.canceled;
    }

    if (normalized.includes('expire')) {
      return SubscriptionPaymentStatus.expired;
    }

    if (normalized.includes('refund')) {
      return SubscriptionPaymentStatus.refunded;
    }

    return SubscriptionPaymentStatus.failed;
  }

  private extractPaymentId(data: Record<string, unknown>) {
    return (
      this.readString(data, 'PaymentId') ||
      this.readNestedString(data, ['InvoiceTransactions', '0', 'PaymentId'])
    );
  }

  private readString(source: Record<string, unknown>, key: string) {
    const value = source[key];
    return this.toReadableString(value);
  }

  private readNestedString(source: Record<string, unknown>, path: string[]) {
    let current: unknown = source;

    for (const key of path) {
      if (Array.isArray(current)) {
        current = current[Number(key)];
      } else if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    if (current === null || current === undefined) {
      return null;
    }

    return this.toReadableString(current);
  }

  private toReadableString(value: unknown) {
    if (value === null || value === undefined) {
      return null;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }

    return null;
  }
}
