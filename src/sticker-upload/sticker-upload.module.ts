import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StickerUploadService } from './sticker-upload.service';
import { StickerUploadController } from './sticker-upload.controller';
import { StickerUpload } from './entities/sticker-upload.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StickerUpload])],
  providers: [StickerUploadService],
  controllers: [StickerUploadController]
})
export class StickerUploadModule {}
