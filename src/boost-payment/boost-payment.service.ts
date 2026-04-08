import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThanOrEqual, Repository } from 'typeorm';
import { BoostPackage } from '../boost-package/entities/boost-package.entity';
import { Posts } from '../post/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { ApplyBoostBalanceDto } from './dto/apply-boost-balance.dto';
import { CreateBoostPaymentRecordDto } from './dto/create-boost-payment-record.dto';
import { BoostPaymentRecord } from './entities/boost-payment-record.entity';
import { PostBoost } from './entities/post-boost.entity';
import { PostBoostStatus } from './enums/post-boost-status.enum';

@Injectable()
export class BoostPaymentService {
  private readonly logger = new Logger(BoostPaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BoostPaymentRecord)
    private readonly boostPaymentRecordRepository: Repository<BoostPaymentRecord>,
    @InjectRepository(PostBoost)
    private readonly postBoostRepository: Repository<PostBoost>,
    @InjectRepository(BoostPackage)
    private readonly boostPackageRepository: Repository<BoostPackage>,
    @InjectRepository(Posts)
    private readonly postRepository: Repository<Posts>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async savePaymentRecord(
    userId: string,
    packageId: string,
    dto: CreateBoostPaymentRecordDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const boostPackage = await manager.getRepository(BoostPackage).findOne({
        where: { id: packageId },
      });

      if (!boostPackage) {
        throw new NotFoundException('Boost package not found');
      }

      const post = await manager.getRepository(Posts).findOne({
        where: { id: dto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.userId !== userId) {
        throw new ForbiddenException('You can only boost your own post');
      }

      const purchasedQuantity = Math.max(boostPackage.boostQuantity, 0);
      const boostQuantityToUseNow =
        dto.boostQuantityToUseNow ?? purchasedQuantity;

      if (boostQuantityToUseNow < 0 || boostQuantityToUseNow > purchasedQuantity) {
        throw new BadRequestException(
          `boostQuantityToUseNow must be between 0 and ${purchasedQuantity}`,
        );
      }

      const isSuccessfulPayment = dto.IsSuccess ?? false;
      const usedQuantity = isSuccessfulPayment ? boostQuantityToUseNow : 0;
      const remainingQuantity = isSuccessfulPayment
        ? purchasedQuantity - boostQuantityToUseNow
        : 0;

      const paymentRecord = await manager.getRepository(BoostPaymentRecord).save(
        manager.getRepository(BoostPaymentRecord).create({
          user_id: userId,
          boost_package_id: packageId,
          post_id: dto.postId,
          purchased_quantity: purchasedQuantity,
          used_quantity: usedQuantity,
          remaining_quantity: remainingQuantity,
          IsSuccess: isSuccessfulPayment,
          Message: dto.Message ?? null,
          ValidationErrors: dto.ValidationErrors ?? null,
          InvoiceId: dto.InvoiceId ?? null,
          InvoiceStatus: dto.InvoiceStatus ?? null,
          InvoiceReference: dto.InvoiceReference ?? null,
          CustomerReference: dto.CustomerReference ?? null,
          CreatedDate: dto.CreatedDate ? new Date(dto.CreatedDate) : null,
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
        }),
      );

      let boostEndAt: Date | null = this.toNullableDate(post.boostEndAt);
      let isBoostRunning =
        typeof post.isBoostRunning === 'boolean' &&
        Boolean(boostEndAt && boostEndAt > new Date());
      let postBoost: PostBoost | null = null;

      if (paymentRecord.IsSuccess && boostQuantityToUseNow > 0) {
        postBoost = await this.createPostBoost(
          manager,
          userId,
          dto.postId,
          packageId,
          paymentRecord.id,
          boostQuantityToUseNow,
        );

        const cache = await this.refreshPostBoostCache(dto.postId, manager);
        boostEndAt = cache.boostEndAt;
        isBoostRunning = cache.isBoostRunning;
      }

      return {
        paymentRecord,
        postBoost,
        paymentRecordId: paymentRecord.id,
        postId: dto.postId,
        usedQuantity,
        remainingQuantity,
        minutesAdded: postBoost?.boost_minutes ?? 0,
        boostEndAt,
        isBoostRunning,
      };
    });
  }

  async applyRemainingBoost(
    userId: string,
    recordId: string,
    dto: ApplyBoostBalanceDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const paymentRecord = await manager.getRepository(BoostPaymentRecord).findOne({
        where: { id: recordId, user_id: userId },
      });

      if (!paymentRecord) {
        throw new NotFoundException('Boost payment record not found');
      }

      if (!paymentRecord.IsSuccess) {
        throw new BadRequestException(
          'Remaining boosts can only be used from a successful payment',
        );
      }

      if (paymentRecord.remaining_quantity < dto.boostQuantity) {
        throw new BadRequestException(
          `Only ${paymentRecord.remaining_quantity} boosts are remaining in this purchase`,
        );
      }

      const post = await manager.getRepository(Posts).findOne({
        where: { id: dto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      if (post.userId !== userId) {
        throw new ForbiddenException('You can only boost your own post');
      }

      const postBoost = await this.createPostBoost(
        manager,
        userId,
        dto.postId,
        paymentRecord.boost_package_id,
        paymentRecord.id,
        dto.boostQuantity,
      );

      paymentRecord.used_quantity += dto.boostQuantity;
      paymentRecord.remaining_quantity -= dto.boostQuantity;
      await manager.getRepository(BoostPaymentRecord).save(paymentRecord);

      const cache = await this.refreshPostBoostCache(dto.postId, manager);

      return {
        paymentRecord,
        postBoost,
        postId: dto.postId,
        usedQuantity: paymentRecord.used_quantity,
        remainingQuantity: paymentRecord.remaining_quantity,
        minutesAdded: postBoost.boost_minutes,
        boostEndAt: cache.boostEndAt,
        isBoostRunning: cache.isBoostRunning,
      };
    });
  }

  @Cron('*/5 * * * *')
  async expireFinishedBoosts() {
    const now = new Date();
    const expiredBoosts = await this.postBoostRepository.find({
      where: {
        status: PostBoostStatus.active,
        ends_at: LessThanOrEqual(now),
      },
      select: ['id', 'post_id'],
    });

    if (!expiredBoosts.length) {
      return;
    }

    await this.postBoostRepository.update(
      { id: In(expiredBoosts.map((boost) => boost.id)) },
      { status: PostBoostStatus.expired },
    );

    const postIds = [...new Set(expiredBoosts.map((boost) => boost.post_id))];
    for (const postId of postIds) {
      await this.refreshPostBoostCache(postId);
    }

    this.logger.log(
      `Boost expiration cleanup ran. Marked ${expiredBoosts.length} boosts as expired.`,
    );
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

  private getPurchasedMinutes(boostQuantity: number) {
    return Math.max(boostQuantity, 0) * 10;
  }

  private async createPostBoost(
    manager: EntityManager,
    userId: string,
    postId: string,
    packageId: string,
    paymentRecordId: string,
    boostQuantity: number,
  ) {
    const minutesAdded = this.getPurchasedMinutes(boostQuantity);
    const startsAt = await this.resolveNextBoostStartAt(postId, manager);
    const endsAt = this.addMinutes(startsAt, minutesAdded);

    return manager.getRepository(PostBoost).save(
      manager.getRepository(PostBoost).create({
        user_id: userId,
        post_id: postId,
        boost_package_id: packageId,
        boost_payment_record_id: paymentRecordId,
        boost_quantity: boostQuantity,
        boost_minutes: minutesAdded,
        starts_at: startsAt,
        ends_at: endsAt,
        status: PostBoostStatus.active,
      }),
    );
  }

  private addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private toNullableDate(value: unknown): Date | null {
    return value instanceof Date ? value : null;
  }

  private async resolveNextBoostStartAt(postId: string, manager = this.dataSource.manager) {
    const latestBoost = await manager.getRepository(PostBoost).findOne({
      where: {
        post_id: postId,
        status: PostBoostStatus.active,
      },
      order: { ends_at: 'DESC' },
    });

    const now = new Date();
    if (latestBoost && latestBoost.ends_at > now) {
      return latestBoost.ends_at;
    }

    return now;
  }

  async refreshPostBoostCache(postId: string, manager = this.dataSource.manager) {
    const now = new Date();
    const latestBoost = await manager.getRepository(PostBoost).findOne({
      where: {
        post_id: postId,
        status: PostBoostStatus.active,
      },
      order: { ends_at: 'DESC' },
    });

    const isBoostRunning = Boolean(latestBoost && latestBoost.ends_at > now);
    const boostEndAt = isBoostRunning ? latestBoost!.ends_at : null;

    await manager.getRepository(Posts).update(postId, {
      isBoostRunning,
      boostEndAt,
    });

    return {
      isBoostRunning,
      boostEndAt,
    };
  }

  async getPaymentRecordInvoice(recordId: string, userId: string) {
    const paymentRecord = await this.boostPaymentRecordRepository.findOne({
      where: { id: recordId },
      relations: ['boost_package', 'post'],
    });

    if (!paymentRecord) {
      throw new NotFoundException('Boost payment record not found');
    }

    if (paymentRecord.user_id !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access this boost payment record',
      );
    }

    const pdfBuffer = this.generatePaymentRecordInvoicePdf(paymentRecord);
    const fileName = `boost-invoice-${paymentRecord.InvoiceId || paymentRecord.id}.pdf`;

    return {
      fileName,
      buffer: pdfBuffer,
    };
  }

  private generatePaymentRecordInvoicePdf(paymentRecord: BoostPaymentRecord) {
    const lines = [
      'Rillo Boost Payment Invoice',
      '',
      `Invoice ID: ${paymentRecord.InvoiceId || 'N/A'}`,
      `Invoice Status: ${paymentRecord.InvoiceStatus || 'N/A'}`,
      `Invoice Reference: ${paymentRecord.InvoiceReference || 'N/A'}`,
      `Customer Name: ${paymentRecord.CustomerName || 'N/A'}`,
      `Customer Mobile: ${paymentRecord.CustomerMobile || 'N/A'}`,
      `Customer Email: ${paymentRecord.CustomerEmail || 'N/A'}`,
      `Boost Package ID: ${paymentRecord.boost_package_id}`,
      `Post ID: ${paymentRecord.post_id}`,
      `Purchased Boost Quantity: ${paymentRecord.purchased_quantity}`,
      `Used Boost Quantity: ${paymentRecord.used_quantity}`,
      `Remaining Boost Quantity: ${paymentRecord.remaining_quantity}`,
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

  private readString(source: Record<string, unknown>, key: string) {
    const value = source[key];
    return this.toReadableString(value);
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
