/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Posts } from './entities/post.entity';
import { DataSource, DeepPartial, LessThanOrEqual, Repository } from 'typeorm';
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
import { FilterCommentsEnum } from './dto/filter-comments.enum';
import { User } from 'src/users/entities/user.entity';
import { Gender } from 'src/users/enum/gender.enum';
import { NotificationService } from 'src/notifications/notifications.service';
import { NotificationTypeEnum } from '../notifications/data/notification-type.enum';
import { NotificationOptions } from '../notifications/data/notification-options';
import { PostPollOption } from './entities/post-poll-options.entity';
import { PostFile } from './entities/post-file.entity';
import { CreatePostReportDto } from './dto/create-post-report.dto';
import { PostReport } from './entities/post-report.entity';
import { PostReportCriteria } from './entities/post-report-criteria.entity';
import { PostHide } from './entities/post-hide.entity';
import { PostNotification } from './entities/post-notification.entity';
import { UserPosttHide } from './entities/user-post-hide.entity';
import { PostPollVote } from './entities/post-poll-vote.entity';
import { PostModeEnum } from './dto/post-mode.enum';
import { ModerationService } from 'src/moderation/moderation.service';
import { PostReportCriteriaEnum } from './dto/post-report-criteria.enum';
import { Comments } from 'src/comments/entities/comment.entity';

@Injectable()
export class PostService {
    private readonly logger = new Logger(PostService.name);

    constructor(
        private readonly dataSource: DataSource,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Posts)
        private readonly postRepo: Repository<Posts>,

        @InjectRepository(PostLike)
        private readonly postLikeRepo: Repository<PostLike>,

        @InjectRepository(PostPin)
        private readonly postPinRepo: Repository<PostPin>,

        @InjectRepository(PostView)
        private readonly postViewRepo: Repository<PostView>,

        @InjectRepository(PostPollOption)
        private readonly postPollOptionRepo: Repository<PostPollOption>,

        @InjectRepository(PostPollVote)
        private readonly postPollVoteRepo: Repository<PostPollVote>,

        @InjectRepository(PostFile)
        private readonly postFileRepo: Repository<PostFile>,

        @InjectRepository(PostReport)
        private readonly postReportRepo: Repository<PostReport>,

        @InjectRepository(PostReportCriteria)
        private readonly postReportCriteriaRepo: Repository<PostReportCriteria>,

        @InjectRepository(UserLocation)
        private readonly userLocationRepo: Repository<UserLocation>,

        @InjectRepository(PostHide)
        private readonly postHideRepo: Repository<PostHide>,

        @InjectRepository(PostNotification)
        private readonly postNotificationRepo: Repository<PostNotification>,

        @InjectRepository(UserPosttHide)
        private readonly userHideRepo: Repository<UserPosttHide>,

        private readonly notificationService: NotificationService,
        @Inject(forwardRef(() => ModerationService))
        private readonly moderationService: ModerationService,
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

    private async syncPostFiles(postId: string, fileIds?: number[]) {
        if (fileIds === undefined) {
            return;
        }

        await this.postFileRepo.delete({ postId });

        const uniqueFileIds = [...new Set(fileIds)];
        if (uniqueFileIds.length === 0) {
            return;
        }

        const postFiles = this.postFileRepo.create(
            uniqueFileIds.map((fileId) => ({
                postId,
                fileId,
            })),
        );

        await this.postFileRepo.save(postFiles);
    }

    private async loadPostWithRelations(postId: string) {
        return this.postRepo.findOne({
            where: { id: postId },
            relations: {
                user: {
                    file: true,
                },
                postFiles: {
                    file: true,
                },
                pollOptions: true,
            },
        });
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
            visibility: dto.visibility ?? PostVisibilityEnum.NORMAL,
            locationId: dto.locationId ?? null,
            location: (currentUserLocation?.location as unknown as Posts['location']) ?? undefined,
            latitude: currentUserLocation?.latitude ?? undefined,
            longitude: currentUserLocation?.longitude ?? undefined,
            area: currentUserLocation?.area ?? undefined,
            city: currentUserLocation?.city ?? undefined,
            state: currentUserLocation?.state ?? undefined,
            country: currentUserLocation?.country ?? undefined,
            linkUrl: dto.linkUrl,
        };
        const post = this.postRepo.create(postData);
        await this.postRepo.save(post);
        await this.syncPostFiles(post.id, dto.fileIds);

        const postPollOptionsData = dto.pollOptions?.map((opt) => ({
            postId: post.id,
            pollOption: opt
        })) as PostPollOption[] | undefined;

        if (postPollOptionsData?.length) {
            const postPollOptions = this.postPollOptionRepo.create(postPollOptionsData);
            await this.postPollOptionRepo.save(postPollOptions);
        }

        return await this.loadPostWithRelations(post.id) as Posts;
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

        const { fileIds, pollOptions, ...postUpdateData } = dto;
        Object.assign(post, postUpdateData);

        await this.postRepo.save(post);
        await this.syncPostFiles(post.id, fileIds);


        if (pollOptions !== undefined) {
            //delete existing post-poll-options
            await this.postPollOptionRepo.delete({ postId: postId });

            //insert new post-poll-options
            const postPollOptionsData = pollOptions.map((opt) => ({
                postId: post.id,
                pollOption: opt
            })) as PostPollOption[];

            if (postPollOptionsData.length) {
                const postPollOptions = this.postPollOptionRepo.create(postPollOptionsData);
                await this.postPollOptionRepo.save(postPollOptions);
            }
        }

        return await this.loadPostWithRelations(post.id);
    }

    async getPostById(postId: string) {
        const post = await this.postRepo.findOneBy({
            id: postId,
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const res = await this.getGlobalFeed(
            post.userId, // logged-in user
            { limit: 1, page: 1 },
            {
                page: 1,
                limit: 1,
            },
            postId
        )

        const reports = await this.postReportRepo.find({
            where: { postId: postId },
            relations: ["criteriaRows"]
        });

        const reportsRes = reports.flatMap(report => {
            return report.criteriaRows.map(criteriaRow => {
                return {
                    criteriaRow: criteriaRow.criteria
                }
            })
        })
        const postReports: { criteria: PostReportCriteriaEnum; count: number }[] = reportsRes.reduce<{ criteria: PostReportCriteriaEnum; count: number }[]>(
            (acc, curr) => {
                const existing = acc.find(item => item.criteria === curr.criteriaRow);

                if (existing) {
                    existing.count++;
                } else {
                    acc.push({ criteria: curr.criteriaRow, count: 1 });
                }

                return acc;
            }, []);



        return { ...res?.items[0], postReports };
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
        //delete existing post-poll-options
        await this.postPollOptionRepo.delete({ postId: postId });

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
        const currentUser = await this.dataSource.getRepository(User).findOne({
            where: { id: userId },
            select: {
                id: true,
                user_name: true,
            },
        });
        const currentUserCity = currentUserLocation?.city?.trim();
        const shouldPrioritizeCurrentUserCity =
            filters?.postMode !== PostModeEnum.Explored && !!currentUserCity;

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
                'CASE WHEN currentUserPollVote.id IS NOT NULL THEN true ELSE false END',
                'isVoted',
            )
            .addSelect(
                'CASE WHEN currentUserPostNotification.id IS NOT NULL THEN true ELSE false END',
                'isNotificationEnabled',
            )
            .addSelect(
                'currentUserPollVote.postPollOptionId',
                'votedId',
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
            .addSelect(
                'postLocation.id',
                'postLocationId',
            )
            .addSelect(
                'postLocation.latitude',
                'postLocationLatitude',
            )
            .addSelect(
                'postLocation.longitude',
                'postLocationLongitude',
            )
            .addSelect(
                'postLocation.area',
                'postLocationArea',
            )
            .addSelect(
                'postLocation.city',
                'postLocationCity',
            )
            .addSelect(
                'postLocation.state',
                'postLocationState',
            )
            .addSelect(
                'postLocation.country',
                'postLocationCountry',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.postFiles', 'postFiles')
            .leftJoinAndSelect('postFiles.file', 'postFile')
            .leftJoinAndSelect('post.pollOptions', 'postPollOptions')
            .leftJoin(
                UserLocation,
                'postLocation',
                'postLocation.id = post.locationId',
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
            .leftJoin(
                PostPollVote,
                'currentUserPollVote',
                'currentUserPollVote.postId = post.id AND currentUserPollVote.userId = :userId',
                { userId },
            )
            .leftJoin(
                PostNotification,
                'currentUserPostNotification',
                'currentUserPostNotification.postId = post.id AND currentUserPostNotification.userId = :userId',
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
            // .where('post.visibility = :visibility', {
            //     visibility: PostVisibilityEnum.NORMAL,
            // })
            .where('1=1')
            .andWhere('post.deletedAt IS NULL');

        if (shouldPrioritizeCurrentUserCity) {
            queryBuilder
                .addSelect(
                    'CASE WHEN post.city ILIKE :currentUserCity THEN 0 ELSE 1 END',
                    'current_user_city_priority',
                )
                .setParameter('currentUserCity', currentUserCity);
        }

        const orderByWithCurrentUserCityPriority = (
            sort: string,
            order: 'ASC' | 'DESC',
        ) => {
            if (shouldPrioritizeCurrentUserCity) {
                queryBuilder
                    .orderBy('current_user_city_priority', 'ASC')
                    .addOrderBy(sort, order);
                return;
            }

            queryBuilder.orderBy(sort, order);
        };

        if (filters.isTopContent && filters.isTopContent === true) {
            orderByWithCurrentUserCityPriority('post.likeCount', 'DESC');
        } else {
            orderByWithCurrentUserCityPriority('post.createdAt', 'DESC');
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
        if (filters?.isOnlyMediaTypeContent) {
            queryBuilder.andWhere('postFiles.id IS NOT NULL')
        }
        if (filters?.search) {
            queryBuilder.andWhere('post.text ILIKE :search', {
                search: `%${filters.search}%`,
            });
        }
        if (filters?.filterComments === FilterCommentsEnum.Own) {
            queryBuilder.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM "rillo_comments" "comment"
                    WHERE "comment"."postId" = post.id
                      AND "comment"."userId" = :userId
                      AND "comment"."deletedAt" IS NULL
                )`,
                { userId },
            );
        }
        if (filters?.filterComments === FilterCommentsEnum.OwnPlusMentions) {
            if (currentUser?.user_name) {
                queryBuilder.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM "rillo_comments" "comment"
                        WHERE "comment"."postId" = post.id
                          AND "comment"."deletedAt" IS NULL
                          AND (
                            "comment"."userId" = :userId
                            OR "comment"."text" ILIKE :mentionPattern
                          )
                    )`,
                    {
                        userId,
                        mentionPattern: `%@${currentUser.user_name}%`,
                    },
                );
            } else {
                queryBuilder.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM "rillo_comments" "comment"
                        WHERE "comment"."postId" = post.id
                          AND "comment"."userId" = :userId
                          AND "comment"."deletedAt" IS NULL
                    )`,
                    { userId },
                );
            }
        }
        if (filters?.userInteractionType) {
            if (filters.userInteractionType === UserInteractionEnum.TheBest) {
                orderByWithCurrentUserCityPriority('post.likeCount', 'DESC');
            }
            if (filters.userInteractionType === UserInteractionEnum.MyFaves) {
                orderByWithCurrentUserCityPriority('post.likeCount', 'DESC');
            }
            if (filters.userInteractionType === UserInteractionEnum.Near) {
                orderByWithCurrentUserCityPriority('distance_km', 'ASC');
                queryBuilder.addOrderBy('post.createdAt', 'DESC');
            }
            if (filters.userInteractionType === UserInteractionEnum.Ghosts) {
                queryBuilder.andWhere('post.visibility= :visibility', {
                    visibility: PostVisibilityEnum.GHOST
                });
            }
            if (filters.userInteractionType === UserInteractionEnum.MyPins) {
                queryBuilder
                    .innerJoin(
                        PostPin,
                        'profilePinnedPost',
                        'profilePinnedPost.postId = post.id AND profilePinnedPost.userId = :userId',
                        { userId },
                    );
            }

        }
        if (filters?.postMode == PostModeEnum.Explored) {
            const exploredCutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

            queryBuilder.andWhere('post.country = "userLocation"."country"');
            queryBuilder.andWhere('post.createdAt >= :exploredCutoffDate', {
                exploredCutoffDate,
            });
            queryBuilder.orderBy('post.likeCount', 'DESC');
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
            isVoted: raw[index].isVoted === true || raw[index].isVoted === 'true',
            votedId: raw[index].votedId ?? raw[index].votedid ?? null,
            user_area: raw[index].userArea ?? raw[index].userarea ?? null,
            user_city: raw[index].userCity ?? raw[index].usercity ?? null,
            user_state: raw[index].userState ?? raw[index].userstate ?? null,
            user_country: raw[index].userCountry ?? raw[index].usercountry ?? null,
            postLocation: post.locationId && (raw[index].postLocationId ?? raw[index].postlocationid)
                ? {
                    id: raw[index].postLocationId ?? raw[index].postlocationid,
                    latitude: raw[index].postLocationLatitude ?? raw[index].postlocationlatitude ?? null,
                    longitude: raw[index].postLocationLongitude ?? raw[index].postlocationlongitude ?? null,
                    area: raw[index].postLocationArea ?? raw[index].postlocationarea ?? null,
                    city: raw[index].postLocationCity ?? raw[index].postlocationcity ?? null,
                    state: raw[index].postLocationState ?? raw[index].postlocationstate ?? null,
                    country: raw[index].postLocationCountry ?? raw[index].postlocationcountry ?? null,
                }
                : null,
            form: 2025,
            likes: 156,
            faves: 46,
            admieres: 1875
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
            .addSelect(
                'CASE WHEN currentUserPostNotification.id IS NOT NULL THEN true ELSE false END',
                'isNotificationEnabled',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.postFiles', 'postFiles')
            .leftJoinAndSelect('postFiles.file', 'postFile')
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
            .leftJoin(
                PostNotification,
                'currentUserPostNotification',
                'currentUserPostNotification.postId = post.id AND currentUserPostNotification.userId = :userId',
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
            isNotificationEnabled:
                raw[index].isNotificationEnabled === true || raw[index].isNotificationEnabled === 'true',
            form: 2025,
            likes: 156,
            faves: 46,
            admieres: 1875
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
        viewerUserId: string, // logged-in user
        profileUserId?: string, // profile owner
        userInteractionType?: UserInteractionEnum,
        filters?: FilterPostDto
    ): Promise<PaginatedResponseDto<Posts>> {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const userId = viewerUserId;

        const currentUserLocation = await this.userLocationRepo.findOne({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
        const currentUser = await this.dataSource.getRepository(User).findOne({
            where: { id: userId },
            select: {
                id: true,
                user_name: true,
            },
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
                'CASE WHEN currentUserPollVote.id IS NOT NULL THEN true ELSE false END',
                'isVoted',
            )
            .addSelect(
                'CASE WHEN currentUserPostNotification.id IS NOT NULL THEN true ELSE false END',
                'isNotificationEnabled',
            )
            .addSelect(
                'currentUserPollVote.postPollOptionId',
                'votedId',
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
            .addSelect(
                'postLocation.id',
                'postLocationId',
            )
            .addSelect(
                'postLocation.latitude',
                'postLocationLatitude',
            )
            .addSelect(
                'postLocation.longitude',
                'postLocationLongitude',
            )
            .addSelect(
                'postLocation.area',
                'postLocationArea',
            )
            .addSelect(
                'postLocation.city',
                'postLocationCity',
            )
            .addSelect(
                'postLocation.state',
                'postLocationState',
            )
            .addSelect(
                'postLocation.country',
                'postLocationCountry',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.postFiles', 'postFiles')
            .leftJoinAndSelect('postFiles.file', 'postFile')
            .leftJoinAndSelect('post.pollOptions', 'postPollOptions')
            .leftJoin(
                UserLocation,
                'postLocation',
                'postLocation.id = post.locationId',
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
            .leftJoin(
                PostPollVote,
                'currentUserPollVote',
                'currentUserPollVote.postId = post.id AND currentUserPollVote.userId = :userId',
                { userId },
            )
            .leftJoin(
                PostNotification,
                'currentUserPostNotification',
                'currentUserPostNotification.postId = post.id AND currentUserPostNotification.userId = :userId',
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
            .where('1=1')
            .andWhere('post.deletedAt IS NULL')
            .orderBy('post.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (profileUserId) {
            queryBuilder
                .andWhere('post.userId = :profileUserId', {
                    profileUserId,
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

        if (userInteractionType) {
            if (userInteractionType === UserInteractionEnum.MyRolla) {
                queryBuilder
                    .andWhere('post.userId = :userId', {
                        userId,
                    });
            } else if (userInteractionType === UserInteractionEnum.MyReplies) {
                queryBuilder
                    .innerJoin(
                        Comments,
                        'postComments',
                        'postComments.postId = post.id AND postComments.userId = :userId',
                        { userId },
                    );
            } else if (userInteractionType === UserInteractionEnum.MyVotes) {
                queryBuilder
                    .innerJoin(
                        PostPollVote,
                        'postPollVote',
                        'postPollVote.postId = post.id AND postPollVote.userId = :userId',
                        { userId },
                    );
            } else if (userInteractionType === UserInteractionEnum.MyPins) {
                queryBuilder
                    .innerJoin(
                        PostPin,
                        'profilePinnedPost',
                        'profilePinnedPost.postId = post.id AND profilePinnedPost.userId = :userId',
                        { userId },
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


        if (filters?.search) {
            queryBuilder.andWhere('post.text ILIKE :search', {
                search: `%${filters?.search}%`,
            });
        }
        if (filters?.filterComments === FilterCommentsEnum.Own) {
            queryBuilder.andWhere(
                `EXISTS (
                    SELECT 1
                    FROM "rillo_comments" "comment"
                    WHERE "comment"."postId" = post.id
                      AND "comment"."userId" = :userId
                      AND "comment"."deletedAt" IS NULL
                )`,
                { userId },
            );
        }
        if (filters?.filterComments === FilterCommentsEnum.OwnPlusMentions) {
            if (currentUser?.user_name) {
                queryBuilder.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM "rillo_comments" "comment"
                        WHERE "comment"."postId" = post.id
                          AND "comment"."deletedAt" IS NULL
                          AND (
                            "comment"."userId" = :userId
                            OR "comment"."text" ILIKE :mentionPattern
                          )
                    )`,
                    {
                        userId,
                        mentionPattern: `%@${currentUser.user_name}%`,
                    },
                );
            } else {
                queryBuilder.andWhere(
                    `EXISTS (
                        SELECT 1
                        FROM "rillo_comments" "comment"
                        WHERE "comment"."postId" = post.id
                          AND "comment"."userId" = :userId
                          AND "comment"."deletedAt" IS NULL
                    )`,
                    { userId },
                );
            }
        }

        const { entities, raw } = await queryBuilder.getRawAndEntities();

        const items = entities.map((post, index) => ({
            ...post,
            distance_km: Number(raw[index].distance_km) || 0,
            isLiked: raw[index].isLiked === true || raw[index].isLiked === 'true',
            isPinned: raw[index].isPinned === true || raw[index].isPinned === 'true',
            isVoted: raw[index].isVoted === true || raw[index].isVoted === 'true',
            isNotificationEnabled:
                raw[index].isNotificationEnabled === true || raw[index].isNotificationEnabled === 'true',
            votedId: raw[index].votedId ?? raw[index].votedid ?? null,
            user_area: raw[index].userArea ?? raw[index].userarea ?? null,
            user_city: raw[index].userCity ?? raw[index].usercity ?? null,
            user_state: raw[index].userState ?? raw[index].userstate ?? null,
            user_country: raw[index].userCountry ?? raw[index].usercountry ?? null,
            postLocation: post.locationId && (raw[index].postLocationId ?? raw[index].postlocationid)
                ? {
                    id: raw[index].postLocationId ?? raw[index].postlocationid,
                    latitude: raw[index].postLocationLatitude ?? raw[index].postlocationlatitude ?? null,
                    longitude: raw[index].postLocationLongitude ?? raw[index].postlocationlongitude ?? null,
                    area: raw[index].postLocationArea ?? raw[index].postlocationarea ?? null,
                    city: raw[index].postLocationCity ?? raw[index].postlocationcity ?? null,
                    state: raw[index].postLocationState ?? raw[index].postlocationstate ?? null,
                    country: raw[index].postLocationCountry ?? raw[index].postlocationcountry ?? null,
                }
                : null,
            form: 2025,
            likes: 156,
            faves: 46,
            admieres: 1875
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

        const subscriberIds = await this.notificationService.getPostNotificationSubscriberIds(
            postId,
            [userId],
        );

        await this.notificationService.sendNotificationToUsers({
            userIds: [post.userId, ...subscriberIds],
            title: NotificationOptions[NotificationTypeEnum.PostLike].title(),
            body: NotificationOptions[NotificationTypeEnum.PostLike].body(),
            payload: NotificationOptions[NotificationTypeEnum.PostLike].payload({ postId: postId }),
        });

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

    async enablePostNotification(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.postNotificationRepo.delete({ postId, userId });

        const entity = this.postNotificationRepo.create({
            postId,
            userId,
        });

        await this.postNotificationRepo.save(entity);

        return {
            postId,
            notificationsEnabled: true,
        };
    }

    async disablePostNotification(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        await this.postNotificationRepo.delete({ postId, userId });

        return {
            postId,
            notificationsEnabled: false,
        };
    }

    async votePoll(postId: string, pollOptionId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.postType !== PostTypeEnum.poll) {
            throw new BadRequestException('This post is not a poll');
        }

        const postPollOption = await this.postPollOptionRepo.findOne({
            where: { postId, id: pollOptionId },
        });

        if (!postPollOption) {
            throw new NotFoundException('Poll option not found for this post');
        }

        const existingVote = await this.postPollVoteRepo.findOne({
            where: { postId, userId },
        });

        if (existingVote) {
            throw new BadRequestException('You have already voted on this poll. Undo your vote first to vote again.');
        }

        await this.dataSource.transaction(async (manager) => {
            const voteRepo = manager.getRepository(PostPollVote);
            const postPollOptionRepo = manager.getRepository(PostPollOption);

            await voteRepo.save(
                voteRepo.create({
                    postId,
                    postPollOptionId: postPollOption.id,
                    userId,
                }),
            );

            await postPollOptionRepo.increment(
                { id: postPollOption.id },
                'pollCount',
                1,
            );
        });

        return {
            postId,
            selectedPollOptionId: pollOptionId,
            hasVoted: true,
        };
    }

    async undoVotePoll(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.postType !== PostTypeEnum.poll) {
            throw new BadRequestException('This post is not a poll');
        }

        const existingVote = await this.postPollVoteRepo.findOne({
            where: { postId, userId },
        });

        if (!existingVote) {
            throw new NotFoundException('Vote not found for this user on this poll');
        }

        await this.dataSource.transaction(async (manager) => {
            const voteRepo = manager.getRepository(PostPollVote);
            const postPollOptionRepo = manager.getRepository(PostPollOption);

            await voteRepo.delete({ id: existingVote.id });
            await postPollOptionRepo.decrement(
                { id: existingVote.postPollOptionId },
                'pollCount',
                1,
            );
        });

        return {
            postId,
            removedPollOptionId: existingVote.postPollOptionId,
            hasVoted: false,
        };
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
            .addSelect(
                'CASE WHEN currentUserPostNotification.id IS NOT NULL THEN true ELSE false END',
                'isNotificationEnabled',
            )
            .leftJoinAndSelect('post.user', 'user')
            .leftJoinAndSelect('user.file', 'userFile')
            .leftJoinAndSelect('post.postFiles', 'postFiles')
            .leftJoinAndSelect('postFiles.file', 'postFile')
            .leftJoinAndSelect('post.pollOptions', 'postPollOptions')
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
            .leftJoin(
                PostNotification,
                'currentUserPostNotification',
                'currentUserPostNotification.postId = post.id AND currentUserPostNotification.userId = :userId',
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
            isNotificationEnabled:
                raw[index].isNotificationEnabled === true || raw[index].isNotificationEnabled === 'true',
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

    async reportPost(postId: string, userId: string, dto: CreatePostReportDto) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const uniqueCriteria = [...new Set(dto.criteria)];

        const result = await this.dataSource.transaction(async (manager) => {
            const reportRepo = manager.getRepository(PostReport);
            const reportCriteriaRepo = manager.getRepository(PostReportCriteria);

            let report = await reportRepo.findOne({
                where: { postId, userId },
            });

            if (!report) {
                report = reportRepo.create({
                    postId,
                    userId,
                });
            }

            report = await reportRepo.save(report);

            await reportCriteriaRepo.delete({ reportId: report.id });

            const criteriaRows = reportCriteriaRepo.create(
                uniqueCriteria.map((criteria) => ({
                    reportId: report.id,
                    criteria,
                })),
            );

            await reportCriteriaRepo.save(criteriaRows);

            return {
                postId,
                reported: true,
                criteria: uniqueCriteria,
            };
        });

        await this.moderationService.recordPostReport(postId);

        return result;
    }

    async reportDelete(reportId: string) {
        const report = await this.postReportRepo.find({
            where: { id: reportId },
            relations: ['post']
        })
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        await this.postReportCriteriaRepo.delete({ reportId });
        await this.postReportRepo.delete({ id: reportId });
    }

    async hidePost(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        //delete previous data
        await this.postHideRepo.delete({ postId, userId });

        //create new data
        const entity = this.postHideRepo.create(
            {
                postId,
                userId,
            }
        );

        return await this.postHideRepo.save(entity);
    }

    async unhidePost(postId: string, userId: string) {
        const post = await this.postRepo.findOne({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        //delete previous data
        return await this.postHideRepo.delete({ postId, userId });
    }

    async userHide(targetUserId: string, loggedInUserId: string) {
        //delete previous data
        await this.userHideRepo.delete({ targetUserId, loggedInUserId });

        //create new data
        const entity = this.userHideRepo.create(
            {
                targetUserId,
                loggedInUserId,
            }
        );

        return await this.userHideRepo.save(entity);
    }

    async userUnHide(targetUserId: string, loggedInUserId: string) {
        await this.userHideRepo.delete({ targetUserId, loggedInUserId });
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
            postType: PostTypeEnum.poll,
            visibility: PostVisibilityEnum.NORMAL,
        });

        await this.postRepo.increment(
            { id: originalPostId },
            'shareCount',
            1,
        );

        const subscriberIds = await this.notificationService.getPostNotificationSubscriberIds(
            originalPostId,
            [userId],
        );

        const postShareUser = await this.userRepo.findOne({
            where: {
                id: userId,
            }
        })

        await this.notificationService.sendNotificationToUsers({
            userIds: [originalPost.userId, ...subscriberIds],
            title: NotificationOptions[NotificationTypeEnum.PostShare].title(),
            body: NotificationOptions[NotificationTypeEnum.PostShare].body(postShareUser?.name),
            payload: NotificationOptions[NotificationTypeEnum.PostShare].payload({ postId: originalPostId }),
        });

        return this.postRepo.save(sharedPost);
    }

    @Cron('*/5 * * * *')
    async markExpiredPollsAsComplete() {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

        this.logger.log(`Running poll expiration check for posts created before ${cutoffDate.toISOString()}`);

        const result = await this.postRepo.update(
            {
                postType: PostTypeEnum.poll,
                isPollComplete: false,
                createdAt: LessThanOrEqual(cutoffDate),
            },
            {
                isPollComplete: true,
            },
        );

        this.logger.log(`Poll expiration check completed. Marked ${result.affected ?? 0} poll posts as complete.`);
    }
}



