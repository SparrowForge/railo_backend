import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateBoostPackageDto } from './dto/create-boost-package.dto';
import { FilterBoostPackageDto } from './dto/filter-boost-package.dto';
import { UpdateBoostPackageDto } from './dto/update-boost-package.dto';
import { BoostPackageBenefit } from './entities/boost-package-benefit.entity';
import { BoostPackage } from './entities/boost-package.entity';

@Injectable()
export class BoostPackageService {
  constructor(
    @InjectRepository(BoostPackage)
    private readonly boostPackageRepository: Repository<BoostPackage>,
    @InjectRepository(BoostPackageBenefit)
    private readonly boostPackageBenefitRepository: Repository<BoostPackageBenefit>,
  ) { }

  async create(dto: CreateBoostPackageDto) {
    const { benifits, ...boostPackageData } = dto;

    const boostPackage = this.boostPackageRepository.create({
      ...boostPackageData,
      benifits: (benifits ?? []).map((benefit) =>
        this.boostPackageBenefitRepository.create({
          desc: benefit.desc,
        }),
      ),
    });

    return this.boostPackageRepository.save(boostPackage);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterBoostPackageDto>,
  ): Promise<PaginatedResponseDto<BoostPackage>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.boostPackageRepository
      .createQueryBuilder('boostPackage')
      .leftJoinAndSelect('boostPackage.benifits', 'benifits')
      .skip(skip)
      .take(limit)
      .orderBy('boostPackage.created_at', 'DESC');

    if (filters?.type) {
      queryBuilder.andWhere('boostPackage.type = :type', {
        type: filters.type,
      });
    }
    if (typeof filters?.isActive === 'boolean') {
      queryBuilder.andWhere('boostPackage.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

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
    return this.boostPackageRepository.findOne({
      where: { id },
      relations: ['benifits'],
    });
  }

  async update(id: string, dto: UpdateBoostPackageDto) {
    const existingPackage = await this.boostPackageRepository.findOne({
      where: { id },
      relations: ['benifits'],
    });

    if (!existingPackage) {
      return null;
    }

    const { benifits, ...boostPackageData } = dto;

    Object.assign(existingPackage, boostPackageData);

    if (benifits) {
      if (existingPackage.benifits?.length) {
        await this.boostPackageBenefitRepository.delete({
          boost_package_id: id,
        });
      }

      existingPackage.benifits = benifits.map((benefit) =>
        this.boostPackageBenefitRepository.create({
          desc: benefit.desc,
          boost_package_id: id,
        }),
      );
    }

    return this.boostPackageRepository.save(existingPackage);
  }

  async remove(id: string) {
    await this.boostPackageBenefitRepository.softDelete({
      boost_package_id: id,
    });

    return this.boostPackageRepository.softDelete(id);
  }

  async permanentRemove(id: string) {
    return this.boostPackageRepository.delete(id);
  }

  async restore(id: string) {
    await this.boostPackageRepository.restore(id);

    return this.boostPackageBenefitRepository.restore({
      boost_package_id: id,
    });
  }
}
