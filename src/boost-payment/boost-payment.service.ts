import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoostPackage } from '../boost-package/entities/boost-package.entity';
import { Posts } from '../post/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreateBoostPaymentRecordDto } from './dto/create-boost-payment-record.dto';
import { BoostPaymentRecord } from './entities/boost-payment-record.entity';

@Injectable()
export class BoostPaymentService {
  constructor(
    @InjectRepository(BoostPaymentRecord)
    private readonly boostPaymentRecordRepository: Repository<BoostPaymentRecord>,
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
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const boostPackage = await this.boostPackageRepository.findOne({
      where: { id: packageId },
    });

    if (!boostPackage) {
      throw new NotFoundException('Boost package not found');
    }

    const post = await this.postRepository.findOne({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const paymentRecord = this.boostPaymentRecordRepository.create({
      user_id: userId,
      boost_package_id: packageId,
      post_id: dto.postId,
      IsSuccess: dto.IsSuccess ?? false,
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
    });

    return this.boostPaymentRecordRepository.save(paymentRecord);
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
}
