import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AwsConfigService } from '../config/aws-config.service';
import { Files } from './entities/file.entity';
import { FileReference } from './entities/file-reference.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3Service } from './s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Files, FileReference]),
    // ScheduleModule.forRoot(), // Uncomment when @nestjs/schedule is installed
  ],
  controllers: [FilesController],
  providers: [FilesService, S3Service, AwsConfigService],
  exports: [FilesService, S3Service],
})
export class FilesModule { }
