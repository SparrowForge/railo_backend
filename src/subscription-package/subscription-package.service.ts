import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateSubscriptionPackageDto } from './dto/create-subscription-package.dto';
import { FilterSubscriptionPackageDto } from './dto/filter-subscription-package.dto';
import { UpdateSubscriptionPackageDto } from './dto/update-subscription-package.dto';
import { SubscriptionPackageBenefit } from './entities/subscription-package-benefit.entity';
import { SubscriptionPackage } from './entities/subscription-package.entity';

@Injectable()
export class SubscriptionPackageService {
  constructor(
    @InjectRepository(SubscriptionPackage)
    private readonly subscriptionPackageRepository: Repository<SubscriptionPackage>,
    @InjectRepository(SubscriptionPackageBenefit)
    private readonly subscriptionPackageBenefitRepository: Repository<SubscriptionPackageBenefit>,
  ) { }

  async create(dto: CreateSubscriptionPackageDto) {
    const { benifits, ...subscriptionPackageData } = dto;

    const subscriptionPackage = this.subscriptionPackageRepository.create({
      ...subscriptionPackageData,
      benifits: (benifits ?? []).map((benefit) =>
        this.subscriptionPackageBenefitRepository.create({
          desc: benefit.desc,
        }),
      ),
    });

    return this.subscriptionPackageRepository.save(subscriptionPackage);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterSubscriptionPackageDto>,
  ): Promise<PaginatedResponseDto<SubscriptionPackage>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.subscriptionPackageRepository
      .createQueryBuilder('subscriptionPackage')
      .leftJoinAndSelect('subscriptionPackage.benifits', 'benifits')
      .skip(skip)
      .take(limit)
      .orderBy('subscriptionPackage.created_at', 'DESC');

    if (filters?.type) {
      queryBuilder.andWhere('subscriptionPackage.type = :type', {
        type: filters.type,
      });
    }
    if (typeof filters?.isActive === "boolean") {
      queryBuilder.andWhere('subscriptionPackage.isActive = :isActive', {
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
    return this.subscriptionPackageRepository.findOne({
      where: { id },
      relations: ['benifits'],
    });
  }

  async update(id: string, dto: UpdateSubscriptionPackageDto) {
    const existingPackage = await this.subscriptionPackageRepository.findOne({
      where: { id },
      relations: ['benifits'],
    });

    if (!existingPackage) {
      return null;
    }

    const { benifits, ...subscriptionPackageData } = dto;

    Object.assign(existingPackage, subscriptionPackageData);

    if (benifits) {
      if (existingPackage.benifits?.length) {
        await this.subscriptionPackageBenefitRepository.delete({
          subscription_package_id: id,
        });
      }

      existingPackage.benifits = benifits.map((benefit) =>
        this.subscriptionPackageBenefitRepository.create({
          desc: benefit.desc,
          subscription_package_id: id,
        }),
      );
    }

    return this.subscriptionPackageRepository.save(existingPackage);
  }

  async remove(id: string) {
    await this.subscriptionPackageBenefitRepository.softDelete({
      subscription_package_id: id,
    });

    return this.subscriptionPackageRepository.softDelete(id);
  }

  async permanentRemove(id: string) {
    return this.subscriptionPackageRepository.delete(id);
  }

  async restore(id: string) {
    await this.subscriptionPackageRepository.restore(id);

    return this.subscriptionPackageBenefitRepository.restore({
      subscription_package_id: id,
    });
  }
}
