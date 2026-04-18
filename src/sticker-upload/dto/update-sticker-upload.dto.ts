import { PartialType } from '@nestjs/swagger';
import { CreateStickerUploadDto } from './create-sticker-upload.dto';

export class UpdateStickerUploadDto extends PartialType(CreateStickerUploadDto) {}
