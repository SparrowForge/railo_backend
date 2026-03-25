import { Module } from '@nestjs/common';
import { PollOptionsController } from './poll-options.controller';
import { PollOptionsService } from './poll-options.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollOptions } from './entity/poll-options.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PollOptions])],
  controllers: [PollOptionsController],
  providers: [PollOptionsService]
})
export class PollOptionsModule { }
