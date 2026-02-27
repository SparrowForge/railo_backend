import { Module } from '@nestjs/common';
import { AppInstructionsService } from './app-instructions.service';
import { AppInstructionsController } from './app-instructions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppInstructions } from './entities/app-instructions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppInstructions])],
  providers: [AppInstructionsService],
  controllers: [AppInstructionsController],
  exports: [AppInstructionsService],
})
export class AppInstructionsModule { }
