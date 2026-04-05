import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPackageController } from './subscription-package.controller';
import { SubscriptionPackageService } from './subscription-package.service';
import { SubscriptionPackageBenefit } from './entities/subscription-package-benefit.entity';
import { SubscriptionPackage } from './entities/subscription-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionPackage, SubscriptionPackageBenefit])],
  controllers: [SubscriptionPackageController],
  providers: [SubscriptionPackageService],
})
export class SubscriptionPackageModule { }
