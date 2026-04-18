import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateStickerUploadDto } from './dto/create-sticker-upload.dto';
import { FilterStickerUploadDto } from './dto/filter-sticker-upload.dto';
import { UpdateStickerUploadDto } from './dto/update-sticker-upload.dto';
import { StickerUpload } from './entities/sticker-upload.entity';

@Injectable()
export class StickerUploadService {
  constructor(
    @InjectRepository(StickerUpload)
    private readonly stickerUploadRepository: Repository<StickerUpload>,
  ) {}

  async create(uploadedByUserId: string, dto: CreateStickerUploadDto) {
    const stickerUpload = this.stickerUploadRepository.create({
      uploaded_by_user_id: uploadedByUserId,
      file_id: dto.file_id,
      is_active: dto.is_active ?? true,
    });

    return await this.stickerUploadRepository.save(stickerUpload);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterStickerUploadDto>,
  ): Promise<PaginatedResponseDto<StickerUpload>> {
    const page = Math.max(1, paginationDto.page ?? 1);
    const limit = Math.min(Math.max(1, paginationDto.limit ?? 10), 100);
    const skip = (page - 1) * limit;

    const qb = this.stickerUploadRepository
      .createQueryBuilder('stickerUpload')
      .leftJoinAndSelect('stickerUpload.uploaded_by_user', 'uploadedByUser')
      .leftJoinAndSelect('stickerUpload.file', 'file')
      .where('stickerUpload.deleted_at IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('stickerUpload.created_at', 'DESC');

    if (filters?.id) {
      qb.andWhere('stickerUpload.id = :id', { id: filters.id });
    }

    if (filters?.uploaded_by_user_id) {
      qb.andWhere('stickerUpload.uploaded_by_user_id = :uploadedByUserId', {
        uploadedByUserId: filters.uploaded_by_user_id,
      });
    }

    if (typeof filters?.file_id === 'number') {
      qb.andWhere('stickerUpload.file_id = :fileId', { fileId: filters.file_id });
    }

    if (typeof filters?.is_active === 'boolean') {
      qb.andWhere('stickerUpload.is_active = :isActive', {
        isActive: filters.is_active,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const item = await this.stickerUploadRepository.findOne({
      where: { id },
      relations: {
        uploaded_by_user: true,
        file: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Sticker upload not found');
    }

    return item;
  }

  async update(id: string, dto: UpdateStickerUploadDto) {
    const stickerUpload = await this.findOne(id);
    Object.assign(stickerUpload, dto);
    return await this.stickerUploadRepository.save(stickerUpload);
  }

  async remove(id: string) {
    const result = await this.stickerUploadRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('Sticker upload not found');
    }

    return result;
  }

  async restore(id: string) {
    const result = await this.stickerUploadRepository.restore(id);

    if (!result.affected) {
      throw new NotFoundException('Sticker upload not found');
    }

    return result;
  }

  async permanentRemove(id: string) {
    const result = await this.stickerUploadRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('Sticker upload not found');
    }

    return result;
  }
}
