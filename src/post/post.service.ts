/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Posts } from './entities/post.entity';
import { DeepPartial, Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';
import { PostVisibilityEnum } from 'src/common/enums/post-visibility.enum';
import { Follow } from 'src/follow/entities/follow.entity';
import { PostTypeEnum } from 'src/common/enums/post-type.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UserLocation } from 'src/user-location/entities/user-location.entity';
import { FilterPostDto } from './dto/filter-post.dto';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Posts)
        private readonly postRepo: Repository<Posts>,

        @InjectRepository(PostLike)
        private readonly postLikeRepo: Repository<PostLike>,

        @InjectRepository(UserLocation)
        private readonly userLocationRepo: Repository<UserLocation>,
    ) { }

    async createPost(userId: string, dto: CreatePostDto,): Promise<Posts> {
        const currentUserLocation = await this.userLocationRepo.findOne({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
        const postData: DeepPartial<Posts> = {
            userId,
            text: dto.text,
            postType: dto.postType,
            visibility: dto.visibility,
            fileId: dto.fileId,
            locationId: dto.locationId ?? null,
            location: (currentUserLocation?.location as unknown as Posts['location']) ?? undefined,
            latitude: currentUserLocation?.latitude ?? undefined,
            longitude: currentUserLocation?.longitude ?? undefined,
        };
        const post = this.postRepo.create(postData);

        return this.postRepo.save(post);
    }

    async updatePost(
        postId: string,
        userId: string,
        dto: UpdatePostDto,
    ) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
                userId
            },
        });

        if (!post) {
            throw new ForbiddenException('You cannot update this post',);
        }

        // 🚫 Prevent editing shared posts (recommended)
        if (post.originalPostId) {
            throw new BadRequestException('Shared posts cannot be edited',);
        }

        Object.assign(post, dto);

        return this.postRepo.save(post);
    }

    async getPostById(postId: string) {
        const post = await this.postRepo.findOneBy({
            id: postId,
        });

        if (!post) {
            throw new ForbiddenException();
        }

        return post;
    }

    async softDelete(postId: string, userId: string) {
        const post = await this.postRepo.findOneBy({
            id: postId,
            userId,
        });

        if (!post) {
            throw new ForbiddenException();
        }

        await this.postRepo.softDelete(postId);
    }

    async permanentDelete(postId: string, userId: string) {
        const post = await this.postRepo.findOneBy({
            id: postId,
            userId,
        });

        if (!post) {
            throw new ForbiddenException();
        }
        await this.postRepo.delete(postId);
    }

    async restore(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
                userId,
            },
            withDeleted: true,
        });


        if (!post) {
            throw new ForbiddenException();
        }
        await this.postRepo.restore(postId);
    }

    async getGlobalFeed(
        userId: string, // logged-in user
        paginationDto: PaginationDto,
        filters: FilterPostDto
    ): Promise<PaginatedResponseDto<any>> {

        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const currentUserLocation = await this.userLocationRepo.findOne({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .addSelect(
                'CASE WHEN currentUserLike.id IS NOT NULL THEN true ELSE false END',
                'isLiked',
            )
            .addSelect(
                'userLocation.area',
                'userArea',
            )
            .addSelect(
                'userLocation.city',
                'userCity',
            )
            .addSelect(
                'userLocation.state',
                'userState',
            )
            .addSelect(
                'userLocation.country',
                'userCountry',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.file', 'postFile')
            .leftJoin(
                PostLike,
                'currentUserLike',
                'currentUserLike.postId = post.id AND currentUserLike.userId = :userId',
                { userId },
            )
            .leftJoin(
                UserLocation,
                'userLocation',
                `userLocation.id = (
                    SELECT ul.id
                    FROM rillo_users_location ul
                    WHERE ul.user_id = post."userId"
                      AND ul.deleted_at IS NULL
                    ORDER BY ul.created_at DESC, ul.id DESC
                    LIMIT 1
                )`,
            )
            .where('post.visibility = :visibility', {
                visibility: PostVisibilityEnum.NORMAL,
            })
            .andWhere('post.deletedAt IS NULL')
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (filters.visibility) {
            queryBuilder.andWhere('post.visibility = :visibility', {
                visibility: filters.visibility,
            });
        }

        if (currentUserLocation) {
            queryBuilder.addSelect(
                `CASE
                    WHEN post.location IS NULL THEN 0
                    ELSE ST_Distance(
                        post.location,
                        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                    ) / 1000
                END`,
                'distance_km',
            ).setParameters({
                longitude: currentUserLocation.longitude,
                latitude: currentUserLocation.latitude,
            });
        } else {
            queryBuilder.addSelect('0', 'distance_km');
        }

        const { entities, raw } = await queryBuilder.getRawAndEntities();

        const items = entities.map((post, index) => ({
            ...post,
            distance_km: Number(raw[index].distance_km) || 0,
            isLiked: raw[index].isLiked === true || raw[index].isLiked === 'true',
            user_area: raw[index].userArea ?? raw[index].userarea ?? null,
            user_city: raw[index].userCity ?? raw[index].usercity ?? null,
            user_state: raw[index].userState ?? raw[index].userstate ?? null,
            user_country: raw[index].userCountry ?? raw[index].usercountry ?? null,
        }));

        const total = await queryBuilder.getCount();
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

    async getUserFeed(
        paginationDto: PaginationDto,
        userId: string, // logged-in user
    ): Promise<PaginatedResponseDto<Posts>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .leftJoin(
                Follow,
                'f',
                'f.followingId = post.userId AND f.followerId = :userId',
                { userId },
            )
            .where(
                '(f.followerId IS NOT NULL OR post.userId = :userId)',
                { userId },
            )
            .andWhere('post.visibility = :visibility', {
                visibility: PostVisibilityEnum.NORMAL,
            })
            .andWhere('post.deletedAt IS NULL')
            .orderBy('post.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

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

    async getUserProfileFeed(
        paginationDto: PaginationDto,
        profileUserId: string, // profile owner
        viewerUserId: string, // logged-in user
    ): Promise<PaginatedResponseDto<Posts>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .where('post.userId = :profileUserId', {
                profileUserId,
            })
            .andWhere('post.deletedAt IS NULL')
            .orderBy('post.createdAt', 'DESC')
            .take(limit)
            .skip(skip);

        // 🔒 privacy rule
        if (viewerUserId !== profileUserId) {
            queryBuilder.andWhere(
                'post.visibility != :visibility',
                { visibility: PostVisibilityEnum.PRIVATE },
            );
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

    async toggleLike(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            }
        });
        if (!post) {
            throw new BadRequestException('Post not found');
        }

        const existing = await this.postLikeRepo.findOne({
            where: { postId, userId },
        });

        if (existing) {
            await this.postLikeRepo.delete(existing.id);

            await this.postRepo.decrement(
                { id: postId },
                'likeCount',
                1,
            );

            return { liked: false };
        }

        await this.postLikeRepo.save(
            this.postLikeRepo.create({ postId, userId }),
        );

        await this.postRepo.increment(
            { id: postId },
            'likeCount',
            1,
        );

        return { liked: true };
    }

    async sharePost(originalPostId: string, userId: string,) {
        const originalPost = await this.postRepo.findOneBy({
            id: originalPostId,
        });

        if (!originalPost) {
            throw new NotFoundException('Post not found');
        }

        const sharedPost = this.postRepo.create({
            userId,
            text: originalPost.text,
            originalPostId,
            postType: PostTypeEnum.time_line,
            visibility: PostVisibilityEnum.NORMAL,
        });

        await this.postRepo.increment(
            { id: originalPostId },
            'shareCount',
            1,
        );

        return this.postRepo.save(sharedPost);
    }
}


