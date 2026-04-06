import { Module } from '@nestjs/common';
import { UserLocationController } from './user-location.controller';
import { UserLocationService } from './user-location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLocation } from './entities/user-location.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation, User])],
  controllers: [UserLocationController],
  providers: [UserLocationService],
  exports: [UserLocationService],
})
export class UserLocationModule { }
