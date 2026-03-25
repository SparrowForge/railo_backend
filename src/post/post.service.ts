/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Posts } from './entities/post.entity';
import { DeepPartial, Repository } from 'typeorm';
import { PostLike } from './entities/post-like.entity';
import { PostPin } from './entities/post-pin.entity';
import { PostView } from './entities/post-view.entity';
import { PostVisibilityEnum } from 'src/common/enums/post-visibility.enum';
import { Follow } from 'src/follow/entities/follow.entity';
import { PostTypeEnum } from 'src/common/enums/post-type.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { UserLocation } from 'src/user-location/entities/user-location.entity';
import { FilterPostDto } from './dto/filter-post.dto';
import { UserInteractionEnum } from './dto/user-interaction-type.enum';
import { User } from 'src/users/entities/user.entity';
import { Gender } from 'src/users/enum/gender.enum';
import { NotificationService } from 'src/notifications/notifications.service';
import { NotificationOptions, NotificationTypeEnum } from 'src/notifications/entity/notification-type.enum';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Posts)
        private readonly postRepo: Repository<Posts>,

        @InjectRepository(PostLike)
        private readonly postLikeRepo: Repository<PostLike>,

        @InjectRepository(PostPin)
        private readonly postPinRepo: Repository<PostPin>,

        @InjectRepository(PostView)
        private readonly postViewRepo: Repository<PostView>,

        @InjectRepository(UserLocation)
        private readonly userLocationRepo: Repository<UserLocation>,

        private readonly notificationService: NotificationService,
    ) { }

    private formatDateKey(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    private normalizeDateKey(value: string | Date): string {
        if (value instanceof Date) {
            return this.formatDateKey(value);
        }

        return value.slice(0, 10);
    }

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

    async getPostById(userId: string, postId: string) {
        const post = await this.postRepo.findOneBy({
            id: postId,
        });

        if (!post) {
            throw new ForbiddenException();
        }

        const res = await this.getGlobalFeed(
            userId, // logged-in user
            { limit: 1, page: 1 },
            {
                page: 1,
                limit: 1,
            },
            postId
        )

        return res?.items[0];
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
        filters: FilterPostDto,
        postId?: string
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
                'CASE WHEN currentUserPin.id IS NOT NULL THEN true ELSE false END',
                'isPinned',
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
                PostPin,
                'currentUserPin',
                'currentUserPin.postId = post.id AND currentUserPin.userId = :userId',
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
            .andWhere('post.deletedAt IS NULL');

        if (filters.isTopContent && filters.isTopContent === true) {
            queryBuilder.orderBy('post.likeCount', 'DESC');
        } else {
            queryBuilder.orderBy('post.createdAt', 'DESC');
        }
        queryBuilder
            .skip(skip)
            .take(limit);
        //=================================================
        if (postId) {
            queryBuilder.andWhere('post.id = :postId', {
                postId,
            });
        }
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
            isPinned: raw[index].isPinned === true || raw[index].isPinned === 'true',
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
    ): Promise<PaginatedResponseDto<any>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .addSelect(
                'CASE WHEN currentUserPin.id IS NOT NULL THEN true ELSE false END',
                'isPinned',
            )
            .addSelect(
                'CASE WHEN currentUserLike.id IS NOT NULL THEN true ELSE false END',
                'isLiked',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.file', 'postFile')
            .leftJoin(
                Follow,
                'f',
                'f.followingId = post.userId AND f.followerId = :userId',
                { userId },
            )
            .leftJoin(
                PostLike,
                'currentUserLike',
                'currentUserLike.postId = post.id AND currentUserLike.userId = :userId',
                { userId },
            )
            .leftJoin(
                PostPin,
                'currentUserPin',
                'currentUserPin.postId = post.id AND currentUserPin.userId = :userId',
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

        const { entities, raw } = await queryBuilder.getRawAndEntities();
        const items = entities.map((post, index) => ({
            ...post,
            isLiked: raw[index].isLiked === true || raw[index].isLiked === 'true',
            isPinned: raw[index].isPinned === true || raw[index].isPinned === 'true',
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

    async getUserProfileFeed(
        paginationDto: PaginationDto,
        profileUserId: string, // profile owner
        viewerUserId: string, // logged-in user
        userInteractionType?: UserInteractionEnum,
    ): Promise<PaginatedResponseDto<Posts>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const userId = viewerUserId;

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
                'CASE WHEN currentUserPin.id IS NOT NULL THEN true ELSE false END',
                'isPinned',
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
                PostPin,
                'currentUserPin',
                'currentUserPin.postId = post.id AND currentUserPin.userId = :userId',
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
            .where('post.userId = :profileUserId', {
                profileUserId,
            })
            .andWhere('post.deletedAt IS NULL')
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

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

        if (userInteractionType) {
            if (userInteractionType === UserInteractionEnum.MyRolla) {
                queryBuilder
                    .andWhere('post.userId = :profileUserId', {
                        profileUserId,
                    });
            } else if (userInteractionType === UserInteractionEnum.MyReplies) {
                queryBuilder
                    .andWhere('post.userId = :profileUserId', {
                        profileUserId,
                    });
            } else if (userInteractionType === UserInteractionEnum.MyVotes) {
                queryBuilder
                    .andWhere('post.userId = :profileUserId', {
                        profileUserId,
                    });
            } else if (userInteractionType === UserInteractionEnum.MyPins) {
                queryBuilder
                    .innerJoin(
                        PostPin,
                        'profilePinnedPost',
                        'profilePinnedPost.postId = post.id AND profilePinnedPost.userId = :profileUserId',
                        { profileUserId },
                    );
            }
        }

        // 🔒 privacy rule
        if (viewerUserId !== profileUserId) {
            queryBuilder.andWhere(
                'post.visibility != :visibility',
                { visibility: PostVisibilityEnum.PRIVATE },
            );
        }

        const { entities, raw } = await queryBuilder.getRawAndEntities();

        const items = entities.map((post, index) => ({
            ...post,
            distance_km: Number(raw[index].distance_km) || 0,
            isLiked: raw[index].isLiked === true || raw[index].isLiked === 'true',
            isPinned: raw[index].isPinned === true || raw[index].isPinned === 'true',
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
        console.log(existing);
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

        await this.notificationService.sendNotificationToUser(
            {
                userId: post.userId,
                title: NotificationOptions[NotificationTypeEnum.PostLike].title(),
                body: NotificationOptions[NotificationTypeEnum.PostLike].body(),
                payload: NotificationOptions[NotificationTypeEnum.PostLike].payload({ postId: postId }),
            })

        return { liked: true };
    }

    async postView(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            }
        });

        if (!post) {
            throw new BadRequestException('Post not found');
        }

        const existing = await this.postViewRepo.findOne({
            where: { postId, userId },
        });

        if (existing) {
            return { viewed: true };
        }

        await this.postViewRepo.save(
            this.postViewRepo.create({ postId, userId }),
        );

        return { viewed: true };
    }

    async togglePin(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            }
        });

        if (!post) {
            throw new BadRequestException('Post not found');
        }

        const existing = await this.postPinRepo.findOne({
            where: { postId, userId },
        });

        if (existing) {
            await this.postPinRepo.delete(existing.id);

            return { pinned: false };
        }

        await this.postPinRepo.save(
            this.postPinRepo.create({ postId, userId }),
        );

        return { pinned: true };
    }

    async getPinnedPosts(
        userId: string,
        paginationDto: PaginationDto,
    ): Promise<PaginatedResponseDto<any>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .addSelect('true', 'isPinned')
            .addSelect(
                'CASE WHEN currentUserLike.id IS NOT NULL THEN true ELSE false END',
                'isLiked',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.file', 'postFile')
            .innerJoin(
                PostPin,
                'postPin',
                'postPin.postId = post.id AND postPin.userId = :userId',
                { userId },
            )
            .leftJoin(
                PostLike,
                'currentUserLike',
                'currentUserLike.postId = post.id AND currentUserLike.userId = :userId',
                { userId },
            )
            .where('post.deletedAt IS NULL')
            .orderBy('postPin.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        const { entities, raw } = await queryBuilder.getRawAndEntities();

        const items = entities.map((post, index) => ({
            ...post,
            isLiked: raw[index].isLiked === true || raw[index].isLiked === 'true',
            isPinned: raw[index].isPinned === true || raw[index].isPinned === 'true',
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

    async getPostViewAnalytics(postId: string, days: number) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new BadRequestException('Post not found');
        }

        if (!Number.isInteger(days) || days < 1) {
            throw new BadRequestException('Days must be a number greater than or equal to 1');
        }

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - (days - 1));

        const chartRows = await this.postViewRepo
            .createQueryBuilder('postView')
            .select(`DATE("postView"."createdAt")`, 'viewDate')
            .addSelect('COUNT(*)', 'viewCount')
            .where('postView.postId = :postId', { postId })
            .andWhere('postView.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .groupBy(`DATE("postView"."createdAt")`)
            .orderBy(`DATE("postView"."createdAt")`, 'ASC')
            .getRawMany<{ viewDate: string | Date; viewCount: string }>();

        const chartRowMap = new Map(
            chartRows.map((row) => [this.normalizeDateKey(row.viewDate), Number(row.viewCount)]),
        );

        const xAxis: string[] = [];
        const yAxis: number[] = [];

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateKey = this.formatDateKey(currentDate);

            xAxis.push(dateKey);
            yAxis.push(chartRowMap.get(dateKey) ?? 0);
        }

        const personCountRaw = await this.postViewRepo
            .createQueryBuilder('postView')
            .innerJoin(User, 'user', 'user.id = postView.userId')
            .select('COUNT(DISTINCT postView.userId)', 'allPersons')
            .addSelect(
                'COUNT(DISTINCT CASE WHEN user.gender = :male THEN postView.userId END)',
                'male',
            )
            .addSelect(
                'COUNT(DISTINCT CASE WHEN user.gender = :female THEN postView.userId END)',
                'female',
            )
            .addSelect(
                'COUNT(DISTINCT CASE WHEN user.gender = :other THEN postView.userId END)',
                'other',
            )
            .where('postView.postId = :postId', { postId })
            .andWhere('postView.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            })
            .andWhere('user.deleted_at IS NULL')
            .setParameters({
                male: Gender.male,
                female: Gender.female,
                other: Gender.other,
            })
            .getRawOne<{
                allPersons: string;
                male: string;
                female: string;
                other: string;
            }>();

        return {
            totalView: yAxis.reduce((acc, curr) => acc + curr, 0),
            chartData: {
                xAxis,
                yAxis,
                minXAxis: xAxis[0] ?? null,
                maxXAxis: xAxis[xAxis.length - 1] ?? null,
                minYAxis: yAxis.length ? Math.min(...yAxis) : 0,
                maxYAxis: yAxis.length ? Math.max(...yAxis) : 0,
            },
            personCount: {
                allPersons: Number(personCountRaw?.allPersons ?? 0),
                male: Number(personCountRaw?.male ?? 0),
                female: Number(personCountRaw?.female ?? 0),
                other: Number(personCountRaw?.other ?? 0),
            },
            viewSource: {
                Home: "100%",
                Profile: "0%",
                Search: "0%",
                Other: "0%",
                ActivityTab: "0%",
            }
        };
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

        await this.notificationService.sendNotificationToUser(
            {
                userId: originalPost.userId,
                title: NotificationOptions[NotificationTypeEnum.PostShare].title(),
                body: NotificationOptions[NotificationTypeEnum.PostShare].body(),
                payload: NotificationOptions[NotificationTypeEnum.PostShare].payload({ postId: originalPostId }),
            })

        return this.postRepo.save(sharedPost);
    }
}


