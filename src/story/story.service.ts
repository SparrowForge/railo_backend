/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, LessThan } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryView } from './entities/story_view.entity';
import { Cron } from '@nestjs/schedule';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { StoryVisibilityEnum } from './entities/story_visibility.enum';
import { StoryLike } from './entities/story_like.entity';

export interface StoryEngagementDto extends Story {
    view_count: number;
    like_count: number;
    is_viewed: boolean;
    is_liked: boolean;
}

@Injectable()
export class StoryService {
    constructor(
        @InjectRepository(Story)
        private readonly storyRepo: Repository<Story>,

        @InjectRepository(StoryView)
        private readonly storyViewRepo: Repository<StoryView>,

        @InjectRepository(StoryLike)
        private readonly storyLikeRepo: Repository<StoryLike>) { }

    async createStory(userId: string, dto: CreateStoryDto): Promise<Story[]> {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const stories = dto.file_id.map((fileId) =>
            this.storyRepo.create({
                user_id: userId,
                file_id: fileId,
                visibility: dto.visibility,
                expires_at: expiresAt,
            }),
        );

        const savedStories = await this.storyRepo.save(stories);
        return savedStories;
    }

    async viewStory(storyId: string, viewerId: string): Promise<{
        view_count: number;
        like_count: number;
        is_viewed: boolean;
        is_liked: boolean;
    }> {
        const story = await this.storyRepo.findOne({
            where: { id: storyId, is_active: true },
        });

        if (!story || story.expires_at <= new Date()) {
            throw new NotFoundException('Story not found');
        }

        const insertResult = await this.storyViewRepo
            .createQueryBuilder()
            .insert()
            .into(StoryView)
            .values({
                story_id: storyId,
                viewer_id: viewerId,
            })
            .orIgnore()
            .execute();

        const inserted =
            (insertResult.identifiers?.length ?? 0) > 0 ||
            (insertResult.generatedMaps?.length ?? 0) > 0;

        if (inserted) {
            await this.storyRepo.increment({ id: storyId }, 'view_count', 1);
        }

        return this.getStoryStats(storyId, viewerId);
    }

    async getActiveStories(
        userId: string,
        paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<StoryEngagementDto>> {
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
        const itemsWithEngagement = await this.attachEngagement(items, userId);
        const totalPages = Math.ceil(total / limit);

        return {
            items: itemsWithEngagement,
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
    ): Promise<PaginatedResponseDto<StoryEngagementDto>> {
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
        const itemsWithEngagement = await this.attachEngagement(items, userId);
        const totalPages = Math.ceil(total / limit);

        return {
            items: itemsWithEngagement,
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

    async toggleLike(storyId: string, userId: string): Promise<{
        liked: boolean;
        view_count: number;
        like_count: number;
        is_viewed: boolean;
        is_liked: boolean;
    }> {
        const story = await this.storyRepo.findOne({
            where: { id: storyId, is_active: true },
        });

        if (!story || story.expires_at <= new Date()) {
            throw new NotFoundException('Story not found');
        }

        const existingLike = await this.storyLikeRepo.findOne({
            where: { story_id: storyId, user_id: userId },
        });

        if (existingLike) {
            await this.storyLikeRepo.delete(existingLike.id);
            await this.storyRepo
                .createQueryBuilder()
                .update(Story)
                .set({
                    like_count: () => 'GREATEST(like_count - 1, 0)',
                })
                .where('id = :storyId', { storyId })
                .execute();
            const stats = await this.getStoryStats(storyId, userId);
            return { liked: false, ...stats };
        }

        const storyLike = this.storyLikeRepo.create({
            story_id: storyId,
            user_id: userId,
        });
        await this.storyLikeRepo.save(storyLike);
        await this.storyRepo.increment({ id: storyId }, 'like_count', 1);

        const stats = await this.getStoryStats(storyId, userId);
        return { liked: true, ...stats };
    }

    async getStoryStats(storyId: string, userId: string): Promise<{
        view_count: number;
        like_count: number;
        is_viewed: boolean;
        is_liked: boolean;
    }> {
        const story = await this.storyRepo.findOne({
            where: { id: storyId, is_active: true },
            select: ['id', 'expires_at', 'view_count', 'like_count'],
        });

        if (!story || story.expires_at <= new Date()) {
            throw new NotFoundException('Story not found');
        }

        const [viewed, liked] = await Promise.all([
            this.storyViewRepo.exist({ where: { story_id: storyId, viewer_id: userId } }),
            this.storyLikeRepo.exist({ where: { story_id: storyId, user_id: userId } }),
        ]);

        return {
            view_count: story.view_count,
            like_count: story.like_count,
            is_viewed: viewed,
            is_liked: liked,
        };
    }

    private async attachEngagement(
        stories: Story[],
        userId: string,
    ): Promise<StoryEngagementDto[]> {
        if (stories.length === 0) {
            return [];
        }

        const storyIds = stories.map((story) => story.id);

        const [viewedRows, likedRows] = await Promise.all([
            this.storyViewRepo.find({
                select: ['story_id'],
                where: { viewer_id: userId, story_id: In(storyIds) },
            }),
            this.storyLikeRepo.find({
                select: ['story_id'],
                where: { user_id: userId, story_id: In(storyIds) },
            }),
        ]);

        const viewedStorySet = new Set<string>(viewedRows.map((row) => row.story_id));
        const likedStorySet = new Set<string>(likedRows.map((row) => row.story_id));

        return stories.map((story) => ({
            ...story,
            view_count: story.view_count ?? 0,
            like_count: story.like_count ?? 0,
            is_viewed: viewedStorySet.has(story.id),
            is_liked: likedStorySet.has(story.id),
        }));
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
