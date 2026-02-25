import { Module } from '@nestjs/common';
import { AppInstructionsService } from './app-instructions.service';
import { AppInstructionsController } from './app-instructions.controller';

@Module({
  providers: [AppInstructionsService],
  controllers: [AppInstructionsController]
})
export class AppInstructionsModule {}
