import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import type AuthUser from 'src/auth/dto/auth-user';
import { CreateStickerUploadDto } from './dto/create-sticker-upload.dto';
import { FilterStickerUploadDto } from './dto/filter-sticker-upload.dto';
import { UpdateStickerUploadDto } from './dto/update-sticker-upload.dto';
import { StickerUpload } from './entities/sticker-upload.entity';
import { StickerUploadService } from './sticker-upload.service';

@ApiTags('Sticker Upload')
@ApiBearerAuth()
@Controller('api/v1/sticker-upload')
export class StickerUploadController {
  constructor(private readonly stickerUploadService: StickerUploadService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sticker upload record' })
  @ApiResponse({
    status: 201,
    description: 'Sticker upload created',
    type: BaseResponseDto<StickerUpload>,
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateStickerUploadDto,
  ) {
    const created = await this.stickerUploadService.create(user.userId, dto);
    return new BaseResponseDto(created, 'Sticker upload created');
  }

  @Get()
  @ApiOperation({ summary: 'List sticker uploads' })
  @ApiResponse({
    status: 200,
    description: 'Sticker uploads retrieved',
    type: BaseResponseDto<PaginatedResponseDto<StickerUpload>>,
  })
  async findAll(@Query() filters: FilterStickerUploadDto) {
    const { page, limit, ...rest } = filters;
    const result = await this.stickerUploadService.findAll(
      { page, limit },
      rest,
    );
    return new BaseResponseDto(result, 'Sticker uploads retrieved');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sticker upload by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Sticker upload retrieved',
    type: BaseResponseDto<StickerUpload>,
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const item = await this.stickerUploadService.findOne(id);
    return new BaseResponseDto(item, 'Sticker upload retrieved');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sticker upload by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Sticker upload updated',
    type: BaseResponseDto<StickerUpload>,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStickerUploadDto,
  ) {
    const updated = await this.stickerUploadService.update(id, dto);
    return new BaseResponseDto(updated, 'Sticker upload updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete sticker upload by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Sticker upload soft deleted',
    type: BaseResponseDto<null>,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.stickerUploadService.remove(id);
    return new BaseResponseDto(null, 'Sticker upload soft deleted');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft deleted sticker upload' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Sticker upload restored',
    type: BaseResponseDto<null>,
  })
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    await this.stickerUploadService.restore(id);
    return new BaseResponseDto(null, 'Sticker upload restored');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete sticker upload by id' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Sticker upload permanently deleted',
    type: BaseResponseDto<null>,
  })
  async permanentRemove(@Param('id', ParseUUIDPipe) id: string) {
    await this.stickerUploadService.permanentRemove(id);
    return new BaseResponseDto(null, 'Sticker upload permanently deleted');
  }
}
