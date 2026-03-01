import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryView } from './entities/story_view.entity';
import { Cron } from '@nestjs/schedule';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { StoryVisibilityEnum } from './entities/story_visibility.enum';

@Injectable()
export class StoryService {
    constructor(
        @InjectRepository(Story)
        private readonly storyRepo: Repository<Story>,

        @InjectRepository(StoryView)
        private readonly storyViewRepo: Repository<StoryView>) { }

    async createStory(userId: string, dto: CreateStoryDto): Promise<Story> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const story = this.storyRepo.create({
            user_id: userId,
            file_id: dto.file_id,
            visibility: dto.visibility,
            expires_at: expiresAt,
        });

        const savedStory = await this.storyRepo.save(story);
        return savedStory;
    }

    async viewStory(storyId: string, viewerId: string): Promise<boolean> {
        const story = await this.storyRepo.findOne({
            where: { id: storyId, is_active: true },
        });

        if (!story || story.expires_at <= new Date()) {
            throw new NotFoundException('Story not found');
        }

        const existing = await this.storyViewRepo.findOne({
            where: { story_id: storyId, viewer_id: viewerId },
        });

        if (!existing) {
            const view = this.storyViewRepo.create({
                story_id: storyId,
                viewer_id: viewerId,
            });

            await this.storyViewRepo.save(view);
        }

        return true;
    }

    async getActiveStories(
        userId: string,
        paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<Story>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.storyRepo
            .createQueryBuilder('story')
            .leftJoinAndSelect('story.file', 'file')
            .where('story.is_active = true')
            .andWhere('story.expires_at > NOW()')
            .andWhere('(story.visibility = :publicVisibility OR story.user_id = :userId)', {
                publicVisibility: StoryVisibilityEnum.Public,
                userId,
            })
            .orderBy('story.created_at', 'DESC')
            .skip(skip)
            .take(limit);

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

    async getUserStories(
        userId: string,
        paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<Story>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.storyRepo
            .createQueryBuilder('story')
            .leftJoinAndSelect('story.file', 'file')
            .where('story.is_active = true')
            .andWhere('story.expires_at > NOW()')
            .andWhere('story.user_id = :userId', { userId })
            .orderBy('story.created_at', 'DESC')
            .skip(skip)
            .take(limit);

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

    async deleteStory(storyId: string, userId: string): Promise<void> {
        const story = await this.storyRepo.findOne({
            where: { id: storyId, user_id: userId, is_active: true },
        });

        if (!story) {
            throw new ForbiddenException('You cannot delete this story');
        }

        await this.storyRepo.softDelete(storyId);
    }

    @Cron('*/5 * * * *')
    async deactivateExpiredStories() {
        await this.storyRepo.update(
            {
                expires_at: LessThan(new Date()),
                is_active: true,
            },
            {
                is_active: false,
            },
        );
    }
}
