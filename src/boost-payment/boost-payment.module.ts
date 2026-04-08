import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoostPackage } from '../boost-package/entities/boost-package.entity';
import { Posts } from '../post/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { BoostPaymentController } from './boost-payment.controller';
import { BoostPaymentService } from './boost-payment.service';
import { BoostPaymentRecord } from './entities/boost-payment-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BoostPaymentRecord,
      BoostPackage,
      Posts,
      User,
    ]),
  ],
  controllers: [BoostPaymentController],
  providers: [BoostPaymentService],
  exports: [BoostPaymentService],
})
export class BoostPaymentModule { }
