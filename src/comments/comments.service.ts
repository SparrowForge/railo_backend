import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Comments } from './entities/comment.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Posts } from 'src/post/entities/post.entity';
import { CommentDto } from './dto/comment.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { NotificationService } from 'src/notifications/notifications.service';
import { NotificationOptions, NotificationTypeEnum } from 'src/notifications/entity/notification-type.enum';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Posts)
        private readonly postRepo: Repository<Posts>,

        @InjectRepository(Comments)
        private readonly commentRepo: Repository<Comments>,

        @InjectRepository(CommentLike)
        private readonly commentLikeRepo: Repository<CommentLike>,

        private readonly notificationService: NotificationService,
    ) { }

    async addComment(userId: string, { postId, text, parentId }: CommentDto) {
        const comment = this.commentRepo.create({
            postId,
            userId,
            text,
            parentId: parentId ?? null,
        });

        await this.commentRepo.save(comment);

        // Only increment post count for root comments
        //if parents comments id not present
        if (!parentId) {
            await this.postRepo.increment(
                { id: postId },
                'commentCount',
                1,
            );
        }

        const post = await this.postRepo.findOne({
            where: { id: postId }
        });

        if (post) {
            await this.notificationService.sendNotificationToUser({
                userId: post.userId,
                title: NotificationOptions[NotificationTypeEnum.PostComment].title(),
                body: NotificationOptions[NotificationTypeEnum.PostComment].body(),
                payload: NotificationOptions[NotificationTypeEnum.PostComment].payload(),
            })
        }

        return comment;
    }

    async update(commentId: string, text: string) {
        const comment = await this.commentRepo.findOne({
            where: {
                id: commentId,
            },
        });

        if (!comment) {
            throw new NotFoundException();
        }

        comment.text = text;

        return this.commentRepo.save(comment);
    }

    async getPostComments(
        paginationDto: PaginationDto,
        postId: string
    ) {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;

        const [items, total] =
            await this.commentRepo.findAndCount({
                where: {
                    postId,
                    parentId: IsNull(),
                    // deletedAt: IsNull(),
                },
                order: {
                    createdAt: 'ASC', // Facebook-style
                },
                relations: ['user', 'user.file'],
                take: limit,
                skip: skip,
            });
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

    async getCommentsById(id: string) {
        return await this.commentRepo.findAndCount({
            where: { id },
            relations: ['user', 'user.file']
        });
    }

    async softDelete(commentId: string) {
        const comment = await this.commentRepo.findOne({
            where: {
                id: commentId,
            },
        });

        if (!comment) {
            throw new NotFoundException();
        }

        await this.commentRepo.softDelete(commentId);
    }

    async restore(commentId: string) {
        const comment = await this.commentRepo.findOne({
            where: {
                id: commentId,
            },
            withDeleted: true,
        });
        if (!comment) {
            throw new NotFoundException();
        }
        await this.commentRepo.restore(commentId);
    }

    async permanentDelete(commentId: string) {
        const comment = await this.commentRepo.findOneBy({
            id: commentId,
        });

        if (!comment) {
            throw new NotFoundException();
        }
        await this.commentRepo.delete(commentId);
    }


    async replyToComment(userId: string, { parentCommentId, text }: ReplyCommentDto) {
        const parentComment = await this.commentRepo.findOne({
            where: {
                id: parentCommentId,
                deletedAt: IsNull(),
            },
        });

        if (!parentComment) {
            throw new NotFoundException('Parent comment not found');
        }

        // Optional: depth limit
        if (parentComment.parentId) {
            // throw new BadRequestException(
            //     'Reply depth limit reached',
            // );
        }

        const reply = this.commentRepo.create({
            postId: parentComment.postId,
            userId,
            text,
            parentId: parentCommentId,
        });

        await this.commentRepo.save(reply);

        // ✅ increment reply count
        await this.commentRepo.increment(
            { id: parentCommentId },
            'replyCount',
            1,
        );

        return reply;
    }


    async getCommentReplies(
        paginationDto: PaginationDto,
        parentCommentId: string
    ) {
        const page = Math.max(1, paginationDto.page ?? 1);
        const limit = Math.min(paginationDto.limit ?? 20, 50);
        const skip = (page - 1) * limit;
        const [items, total] =
            await this.commentRepo.findAndCount({
                where: {
                    parentId: parentCommentId,
                    deletedAt: IsNull(),
                },
                relations: ['user'],
                order: { createdAt: 'ASC' },
                take: limit,
                skip: skip,
            });

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


    async toggleCommentLike(commentId: string, userId: string,) {
        const exists = await this.commentLikeRepo.findOne({
            where: { commentId, userId },
        });

        if (exists) {
            await this.commentLikeRepo.delete(exists.id);
            await this.commentRepo.decrement(
                { id: commentId },
                'likeCount',
                1,
            );
            return { liked: false };
        }

        await this.commentLikeRepo.save(
            this.commentLikeRepo.create({ commentId, userId }),
        );

        await this.commentRepo.increment(
            { id: commentId },
            'likeCount',
            1,
        );

        return { liked: true };
    }

}
