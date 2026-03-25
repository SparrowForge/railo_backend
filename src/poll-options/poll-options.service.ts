import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterPollOptionsDto } from './dto/filter-poll-options.dto';
import { CreatePollOptionsDto } from './dto/create-poll-options.dto';
import { PollOptions } from './entity/poll-options.entity';
import { UpdatePollOptionsDto } from './dto/update-poll-options.dto';

@Injectable()
export class PollOptionsService {
    constructor(
        @InjectRepository(PollOptions)
        private polloptionsRepository: Repository<PollOptions>,
    ) { }

    async create(dto: CreatePollOptionsDto) {
        const existingOption = await this.polloptionsRepository
            .createQueryBuilder('option')
            .where('UPPER(option.name) = UPPER(:name)', {
                name: dto.name,
            })
            .getOne();

        if (existingOption) {
            throw new InternalServerErrorException('Poll option already exists');
        }

        const polloptions = this.polloptionsRepository.create(dto);
        return this.polloptionsRepository.save(polloptions);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterPollOptionsDto>,
    ): Promise<PaginatedResponseDto<PollOptions>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.polloptionsRepository
            .createQueryBuilder('polloptions')
            .leftJoinAndSelect('polloptions.users', 'users')
            .skip(skip)
            .take(limit)
            .orderBy('polloptions.name', 'ASC');

        if (filters?.name) {
            queryBuilder.andWhere('polloptions.name = :name', {
                name: filters.name,
            });
        }
        // is_active
        if (filters?.is_active) {
            queryBuilder.andWhere('polloptions.is_active = :is_active', {
                is_active: filters.is_active,
            });
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage,
                hasPreviousPage,
            },
        };
    }

    findOne(id: string) {
        return this.polloptionsRepository.findOne({
            where: { id },
            relations: ['users'],
            withDeleted: false, // Only get non-deleted users
        });
    }

    async update(id: string, dto: UpdatePollOptionsDto) {
        const existingOption = await this.polloptionsRepository
            .createQueryBuilder('option')
            .where('UPPER(option.name) = UPPER(:name)', {
                name: dto.name,
            })
            .andWhere('option.id != :id', { id })
            .getOne();

        if (existingOption) {
            throw new InternalServerErrorException('Poll option already exists');
        }

        return this.polloptionsRepository.update(id, dto);
    }

    remove(id: string) {
        return this.polloptionsRepository.softDelete(id);
    }

    permanentRemove(id: string) {
        return this.polloptionsRepository.delete(id);
    }

    restore(id: string) {
        return this.polloptionsRepository.restore(id);
    }
}

