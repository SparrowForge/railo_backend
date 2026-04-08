import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPackage } from '../subscription-package/entities/subscription-package.entity';
import { User } from '../users/entities/user.entity';
import { PaymentRecords } from './entities/payments-record.entity';
import { SubscriptionPayment } from './entities/subscription-payment.entity';
import { UserSubscription } from './entities/user-subscription.entity';
import { MyFatoorahService } from './myfatoorah.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPayment,
      PaymentRecords,
      UserSubscription,
      SubscriptionPackage,
      User,
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, MyFatoorahService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
