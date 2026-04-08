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
import { CreatePaymentRecordDto } from './dto/create-payment-record.dto';
import { PaymentRecords } from './entities/payments-record.entity';
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
    @InjectRepository(PaymentRecords)
    private readonly paymentRecordsRepository: Repository<PaymentRecords>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPackage)
    private readonly subscriptionPackageRepository: Repository<SubscriptionPackage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly myFatoorahService: MyFatoorahService,
  ) { }

  async savePaymentRecord(
    userId: string,
    packageId: string,
    dto: CreatePaymentRecordDto,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscriptionPackage = await this.subscriptionPackageRepository.findOne({
      where: { id: packageId },
    });

    if (!subscriptionPackage) {
      throw new NotFoundException('Subscription package not found');
    }

    const paymentRecord = this.paymentRecordsRepository.create({
      user_id: userId,
      subscription_package_id: packageId,
      IsSuccess: dto.IsSuccess ?? false,
      Message: dto.Message ?? null,
      ValidationErrors: dto.ValidationErrors ?? null,
      InvoiceId: dto.InvoiceId ?? null,
      InvoiceStatus: dto.InvoiceStatus ?? null,
      InvoiceReference: dto.InvoiceReference ?? null,
      CustomerReference: dto.CustomerReference ?? null,
      CreatedDate: dto.CreatedDate
        ? new Date(dto.CreatedDate)
        : null,
      ExpiryDate: this.normalizeDateOnly(dto.ExpiryDate),
      ExpiryTime: dto.ExpiryTime ?? null,
      InvoiceValue: dto.InvoiceValue ?? null,
      Comments: dto.Comments ?? null,
      CustomerName: dto.CustomerName ?? null,
      CustomerMobile: dto.CustomerMobile ?? null,
      CustomerEmail: dto.CustomerEmail ?? null,
      UserDefinedField: dto.UserDefinedField ?? null,
      InvoiceDisplayValue: dto.InvoiceDisplayValue ?? null,
      DueDeposit: dto.DueDeposit ?? null,
      DepositStatus: dto.DepositStatus ?? null,
      InvoiceItems: dto.InvoiceItems ?? null,
      InvoiceTransactions: dto.InvoiceTransactions ?? null,
      Suppliers: dto.Suppliers ?? null,
    });

    const savedPaymentRecord = await this.paymentRecordsRepository.save(
      paymentRecord,
    );

    await this.userRepository.update(userId, {
      isSubscribedUser: true,
    });

    return savedPaymentRecord;
  }

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

  async getPaymentRecordInvoice(recordId: string, userId: string) {
    const paymentRecord = await this.paymentRecordsRepository.findOne({
      where: { id: recordId },
      relations: ['subscription_package'],
    });

    if (!paymentRecord) {
      throw new NotFoundException('Payment record not found');
    }

    if (paymentRecord.user_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access this payment record',
      );
    }

    const pdfBuffer = this.generatePaymentRecordInvoicePdf(paymentRecord);
    const fileName = `invoice-${paymentRecord.InvoiceId || paymentRecord.id}.pdf`;

    return {
      fileName,
      buffer: pdfBuffer,
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

  private normalizeDateOnly(value?: string | null) {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private generatePaymentRecordInvoicePdf(paymentRecord: PaymentRecords) {
    const lines = [
      'Rillo Payment Invoice',
      '',
      `Invoice ID: ${paymentRecord.InvoiceId || 'N/A'}`,
      `Invoice Status: ${paymentRecord.InvoiceStatus || 'N/A'}`,
      `Invoice Reference: ${paymentRecord.InvoiceReference || 'N/A'}`,
      `Customer Name: ${paymentRecord.CustomerName || 'N/A'}`,
      `Customer Mobile: ${paymentRecord.CustomerMobile || 'N/A'}`,
      `Customer Email: ${paymentRecord.CustomerEmail || 'N/A'}`,
      `Package ID: ${paymentRecord.subscription_package_id}`,
      `Amount: ${paymentRecord.InvoiceDisplayValue || paymentRecord.InvoiceValue || 'N/A'}`,
      `Due Deposit: ${paymentRecord.DueDeposit ?? 'N/A'}`,
      `Deposit Status: ${paymentRecord.DepositStatus || 'N/A'}`,
      `Created Date: ${this.formatDateTime(paymentRecord.CreatedDate)}`,
      `Expiry Date: ${paymentRecord.ExpiryDate || 'N/A'}`,
      `Expiry Time: ${paymentRecord.ExpiryTime || 'N/A'}`,
      '',
      'Transactions',
      ...(paymentRecord.InvoiceTransactions?.length
        ? paymentRecord.InvoiceTransactions.flatMap((transaction, index) => [
            `Transaction ${index + 1}:`,
            `  Payment Gateway: ${this.readString(transaction, 'PaymentGateway') || 'N/A'}`,
            `  Transaction ID: ${this.readString(transaction, 'TransactionId') || 'N/A'}`,
            `  Payment ID: ${this.readString(transaction, 'PaymentId') || 'N/A'}`,
            `  Track ID: ${this.readString(transaction, 'TrackId') || 'N/A'}`,
            `  Reference ID: ${this.readString(transaction, 'ReferenceId') || 'N/A'}`,
            `  Status: ${this.readString(transaction, 'TransactionStatus') || 'N/A'}`,
            `  Date: ${this.readString(transaction, 'TransactionDate') || 'N/A'}`,
            `  Currency: ${this.readString(transaction, 'Currency') || 'N/A'}`,
            `  Country: ${this.readString(transaction, 'Country') || 'N/A'}`,
            '',
          ])
        : ['No transactions found']),
    ];

    return this.buildSimplePdf(lines);
  }

  private formatDateTime(value?: Date | null) {
    if (!value) {
      return 'N/A';
    }

    return value.toISOString();
  }

  private buildSimplePdf(lines: string[]) {
    const sanitizedLines = lines.map((line) => this.escapePdfText(line));
    const contentLines = ['BT', '/F1 12 Tf', '50 780 Td', '14 TL'];

    sanitizedLines.forEach((line, index) => {
      if (index === 0) {
        contentLines.push(`(${line}) Tj`);
        return;
      }

      contentLines.push('T*');
      contentLines.push(`(${line}) Tj`);
    });

    contentLines.push('ET');

    const contentStream = contentLines.join('\n');
    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
      `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream\nendobj`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    objects.forEach((object) => {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${object}\n`;
    });

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';

    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, 'utf8');
  }

  private escapePdfText(value: string) {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}
