import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoostPackageController } from './boost-package.controller';
import { BoostPackageService } from './boost-package.service';
import { BoostPackageBenefit } from './entities/boost-package-benefit.entity';
import { BoostPackage } from './entities/boost-package.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BoostPackage, BoostPackageBenefit])],
  controllers: [BoostPackageController],
  providers: [BoostPackageService],
})
export class BoostPackageModule { }
