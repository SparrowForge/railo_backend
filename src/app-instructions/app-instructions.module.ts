import { Module } from '@nestjs/common';
import { AppInstructionsService } from './app-instructions.service';
import { AppInstructionsController } from './app-instructions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppInstruction } from './entities/app-instructions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppInstruction])],
  providers: [AppInstructionsService],
  controllers: [AppInstructionsController],
  exports: [AppInstructionsService],
})
export class AppInstructionsModule { }
