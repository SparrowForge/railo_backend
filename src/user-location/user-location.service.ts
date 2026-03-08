import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserLocation } from './entities/user-location.entity';
import { CreateUserLocationDto } from './dto/create-user-location.dto';
import { FilterUserLocationDto } from './dto/filter-user-location.dto';

@Injectable()
export class UserLocationService {
    constructor(
        @InjectRepository(UserLocation)
        private userlocationRepository: Repository<UserLocation>,
    ) { }

    async create(userlocationDto: CreateUserLocationDto) {
        const userlocation = this.userlocationRepository.create(userlocationDto);
        return this.userlocationRepository.save(userlocation);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterUserLocationDto>,
    ): Promise<PaginatedResponseDto<UserLocation>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.userlocationRepository
            .createQueryBuilder('userlocation')
            .leftJoinAndSelect('userlocation.users', 'users')
            .skip(skip)
            .take(limit)
            .orderBy('userlocation.created_at', 'DESC');

        if (filters?.user_id) {
            queryBuilder.andWhere('userlocation.user_id = :user_id', {
                user_id: filters.user_id,
            });
        }
        if (filters?.area) {
            queryBuilder.andWhere('userlocation.area ILIKE :area', {
                area: `%${filters.area}%`,
            });
        }
        if (filters?.city) {
            queryBuilder.andWhere('userlocation.city ILIKE :city', {
                city: `%${filters.city}%`,
            });
        }
        if (filters?.state) {
            queryBuilder.andWhere('userlocation.state ILIKE :state', {
                state: `%${filters.state}%`,
            });
        }
        if (filters?.country) {
            queryBuilder.andWhere('userlocation.country ILIKE :country', {
                country: `%${filters.country}%`,
            });
        }
        if (filters?.user_id && filters?.area_in_length_km) {
            queryBuilder.andWhere('ST_DistanceSphere(userlocation.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)) <= :area_in_length_km', {
                longitude: filters.user_id.longitude,
                latitude: filters.user_id.latitude,
                area_in_length_km: filters.area_in_length_km,
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
        return this.userlocationRepository.findOne({
            where: { id },
            relations: ['users'],
            withDeleted: false, // Only get non-deleted users
        });
    }

    update(id: string, dto: CreateUserLocationDto) {
        return this.userlocationRepository.update(id, dto);
    }

    remove(id: string) {
        return this.userlocationRepository.softDelete(id);
    }

    // Method to permanently delete a user (for admin purposes)
    permanentRemove(id: string) {
        return this.userlocationRepository.delete(id);
    }

    // Method to restore a soft-deleted user
    restore(id: string) {
        return this.userlocationRepository.restore(id);
    }
}

