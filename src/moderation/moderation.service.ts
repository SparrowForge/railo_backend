/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatReport } from '../chat/entities/chat-report.entity';
import { CommentReport } from '../comments/entities/comment-report.entity';
import { Comments } from '../comments/entities/comment.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { PostReport } from '../post/entities/post-report.entity';
import { Posts } from '../post/entities/post.entity';
import { ModerationAction } from './entities/moderation-action.entity';
import { ModerationCase } from './entities/moderation-case.entity';
import { ModerationRequest } from './entities/moderation-request.entity';
import { ModerationActionTypeEnum } from './enums/moderation-action-type.enum';
import { ModerationCaseStatusEnum } from './enums/moderation-case-status.enum';
import { ModerationRequestStatusEnum } from './enums/moderation-request-status.enum';
import { ModerationTargetTypeEnum } from './enums/moderation-target-type.enum';
import { User } from '../users/entities/user.entity';
import { PostService } from 'src/post/post.service';

type ModerationEvidence = {
  id: string;
  createdAt: Date;
  reporter: {
    id: string;
    name: string;
    userName: string;
    fileUrl: string | null;
  } | null;
  criteria: string[];
};

@Injectable()
export class ModerationService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Posts)
    private readonly postRepository: Repository<Posts>,

    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,

    @InjectRepository(Comments)
    private readonly commentRepository: Repository<Comments>,

    @InjectRepository(PostReport)
    private readonly postReportRepository: Repository<PostReport>,

    @InjectRepository(ChatReport)
    private readonly chatReportRepository: Repository<ChatReport>,

    @InjectRepository(CommentReport)
    private readonly commentReportRepository: Repository<CommentReport>,

    @InjectRepository(ModerationCase)
    private readonly moderationCaseRepository: Repository<ModerationCase>,

    @InjectRepository(ModerationAction)
    private readonly moderationActionRepository: Repository<ModerationAction>,

    @InjectRepository(ModerationRequest)
    private readonly moderationRequestRepository: Repository<ModerationRequest>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,
  ) { }

  async createModerationRequest(requestedById: string, message?: string) {
    const user = await this.userRepository.findOne({
      where: { id: requestedById },
      select: ['id', 'is_moderation_user'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_moderation_user) {
      throw new ConflictException('User is already a moderation user');
    }

    const existingPendingRequest = await this.moderationRequestRepository.findOne({
      where: {
        requestedById,
        status: ModerationRequestStatusEnum.pending,
      },
    });

    if (existingPendingRequest) {
      throw new ConflictException('You already have a pending moderation request');
    }

    const request = this.moderationRequestRepository.create({
      requestedById,
      message: message?.trim() || null,
      reviewNote: null,
      status: ModerationRequestStatusEnum.pending,
      reviewedById: null,
      reviewedAt: null,
    });

    return this.moderationRequestRepository.save(request);
  }

  async listModerationRequests(filters: {
    page?: number;
    limit?: number;
    status?: ModerationRequestStatusEnum;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.moderationRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestedBy', 'requestedBy')
      .leftJoinAndSelect('request.reviewedBy', 'reviewedBy')
      .orderBy('request.createdAt', 'DESC');

    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', { status: filters.status });
    }

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
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

  async getMyModerationRequest(requestedById: string) {
    return this.moderationRequestRepository.find({
      where: { requestedById },
      relations: {
        requestedBy: true,
        reviewedBy: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelModerationRequest(requestedById: string) {
    const request = await this.moderationRequestRepository.findOne({
      where: {
        requestedById,
        status: ModerationRequestStatusEnum.pending,
      },
    });

    if (!request) {
      throw new NotFoundException('Pending moderation request not found');
    }

    request.status = ModerationRequestStatusEnum.cancelled;
    request.reviewedById = null;
    request.reviewedAt = null;
    request.reviewNote = 'Cancelled by request owner';

    return this.moderationRequestRepository.save(request);
  }

  async reviewModerationRequest(
    requestId: string,
    reviewedById: string,
    approve: boolean,
    note?: string,
  ) {
    const request = await this.moderationRequestRepository.findOne({
      where: { id: requestId },
      relations: { requestedBy: true },
    });

    if (!request) {
      throw new NotFoundException('Moderation request not found');
    }

    if (request.status !== ModerationRequestStatusEnum.pending) {
      throw new BadRequestException('This moderation request has already been reviewed');
    }

    if (request.requestedById === reviewedById) {
      throw new BadRequestException('You cannot review your own moderation request');
    }

    request.status = approve
      ? ModerationRequestStatusEnum.approved
      : ModerationRequestStatusEnum.rejected;
    request.reviewedById = reviewedById;
    request.reviewedAt = new Date();
    request.reviewNote = note?.trim() || null;

    const savedRequest = await this.moderationRequestRepository.save(request);

    if (approve) {
      await this.userRepository.update(request.requestedById, {
        is_moderation_user: true,
      });
    }

    return {
      request: savedRequest,
      moderationUserGranted: approve,
    };
  }

  async recordPostReport(postId: string): Promise<ModerationCase> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      select: ['id'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.upsertCase(
      ModerationTargetTypeEnum.post,
      postId,
      async () => {
        const reportCount = await this.postReportRepository.count({
          where: { postId },
        });

        const latestReport = await this.postReportRepository.findOne({
          where: { postId },
          order: { createdAt: 'DESC' },
        });

        return {
          reportCount,
          lastReportedAt: latestReport?.createdAt ?? new Date(),
        };
      },
    );
  }

  async recordConversationReport(conversationId: string): Promise<ModerationCase> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      select: ['id'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.upsertConversationCase(
      ModerationTargetTypeEnum.conversation,
      conversationId,
      async () => {
        const reportCount = await this.chatReportRepository.count({
          where: { conversationId },
        });

        const latestReport = await this.chatReportRepository.findOne({
          where: { conversationId },
          order: { createdAt: 'DESC' },
        });

        return {
          reportCount,
          lastReportedAt: latestReport?.createdAt ?? new Date(),
        };
      },
    );
  }

  async recordCommentReport(commentId: string): Promise<ModerationCase> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      select: ['id'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return this.upsertCommentCase(
      ModerationTargetTypeEnum.comment,
      commentId,
      async () => {
        const reportCount = await this.commentReportRepository.count({
          where: { commentId },
        });

        const latestReport = await this.commentReportRepository.findOne({
          where: { commentId },
          order: { createdAt: 'DESC' },
        });

        return {
          reportCount,
          lastReportedAt: latestReport?.createdAt ?? new Date(),
        };
      },
    );
  }

  async listCases(filters: {
    page?: number;
    limit?: number;
    status?: ModerationCaseStatusEnum;
    targetType?: ModerationTargetTypeEnum;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.moderationCaseRepository
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.post', 'post')
      .leftJoinAndSelect('case.conversation', 'conversation')
      .leftJoinAndSelect('case.postComments', 'postComments')
      .leftJoinAndSelect('post.user', 'user')
      .orderBy('case.lastReportedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('case.updatedAt', 'DESC');

    if (filters.status) {
      queryBuilder.andWhere('case.status = :status', { status: filters.status });
    }

    if (filters.targetType) {
      queryBuilder.andWhere('case.targetType = :targetType', {
        targetType: filters.targetType,
      });
    }

    const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    const enrichedItems = await Promise.all(items.map((item) => this.enrichCase(item)));
    const totalPages = Math.ceil(total / limit);

    return {
      items: enrichedItems,
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

  async getCase(caseId: string) {
    const moderationCase = await this.moderationCaseRepository.findOne({
      where: { id: caseId },
    });

    if (!moderationCase) {
      throw new NotFoundException('Moderation case not found');
    }

    return this.getCaseDetail(moderationCase);
  }

  async deleteCase(caseId: string) {
    // const moderationCase = await this.moderationCaseRepository.findOne({
    //   where: { id: caseId },
    // })
    await this.moderationActionRepository.delete({ caseId: caseId })
    await this.moderationCaseRepository.delete({ id: caseId })
  }

  async claimCase(caseId: string, moderatorUserId: string) {
    const moderationCase = await this.getCaseOrFail(caseId);

    if (
      moderationCase.status === ModerationCaseStatusEnum.resolved ||
      moderationCase.status === ModerationCaseStatusEnum.dismissed
    ) {
      throw new BadRequestException('This case has already been closed');
    }

    moderationCase.status = ModerationCaseStatusEnum.in_review;
    moderationCase.reviewedAt = new Date();
    await this.moderationCaseRepository.save(moderationCase);

    await this.moderationActionRepository.save(
      this.moderationActionRepository.create({
        caseId: moderationCase.id,
        moderatorUserId,
        actionType: ModerationActionTypeEnum.claim,
        note: null,
      }),
    );

    return this.getCaseDetail(moderationCase);
  }

  async performAction(
    caseId: string,
    moderatorUserId: string,
    actionType: ModerationActionTypeEnum,
    note?: string,
  ) {
    await this.getCaseOrFail(caseId);
    const action = await this.dataSource.transaction(async (manager) => {
      const caseRepo = manager.getRepository(ModerationCase);
      const actionRepo = manager.getRepository(ModerationAction);
      const postRepo = manager.getRepository(Posts);
      const conversationRepo = manager.getRepository(Conversation);

      const currentCase = await caseRepo.findOneByOrFail({ id: caseId });

      switch (actionType) {
        case ModerationActionTypeEnum.dismiss:
          currentCase.status = ModerationCaseStatusEnum.dismissed;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.escalate:
          currentCase.status = ModerationCaseStatusEnum.escalated;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.hide_post:
          this.ensureTargetType(currentCase, ModerationTargetTypeEnum.post, actionType);
          await postRepo.softDelete(currentCase.postId);
          currentCase.status = ModerationCaseStatusEnum.resolved;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.restore_post:
          this.ensureTargetType(currentCase, ModerationTargetTypeEnum.post, actionType);
          await postRepo.restore(currentCase.postId);
          currentCase.status = ModerationCaseStatusEnum.resolved;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.lock_conversation:
          this.ensureTargetType(currentCase, ModerationTargetTypeEnum.conversation, actionType);
          await conversationRepo.update(
            { id: currentCase.conversationId },
            {
              is_moderation_locked: true,
              moderation_locked_by: moderatorUserId,
              moderation_locked_at: new Date(),
              moderation_lock_reason: note ?? null,
            },
          );
          currentCase.status = ModerationCaseStatusEnum.resolved;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.unlock_conversation:
          this.ensureTargetType(currentCase, ModerationTargetTypeEnum.conversation, actionType);
          await conversationRepo.update(
            { id: currentCase.conversationId },
            {
              is_moderation_locked: false,
              moderation_locked_by: null,
              moderation_locked_at: null,
              moderation_lock_reason: null,
            },
          );
          currentCase.status = ModerationCaseStatusEnum.resolved;
          currentCase.reviewedAt = new Date();
          break;
        case ModerationActionTypeEnum.claim:
          currentCase.status = ModerationCaseStatusEnum.in_review;
          currentCase.reviewedAt = new Date();
          break;
        default:
          throw new BadRequestException('Unsupported moderation action');
      }

      await caseRepo.save(currentCase);

      return actionRepo.save(
        actionRepo.create({
          caseId: currentCase.id,
          moderatorUserId,
          actionType,
          note: note ?? null,
        }),
      );
    });

    return {
      action,
      case: await this.getCase(caseId),
    };
  }

  async getStatus() {
    const [statusRows, targetTypeRows, actionRows, totalCases] = await Promise.all([
      this.moderationCaseRepository
        .createQueryBuilder('case')
        .select('case.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('case.status')
        .getRawMany<{ status: ModerationCaseStatusEnum; count: string }>(),
      this.moderationCaseRepository
        .createQueryBuilder('case')
        .select('case.targetType', 'targetType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('case.targetType')
        .getRawMany<{ targetType: ModerationTargetTypeEnum; count: string }>(),
      this.moderationActionRepository
        .createQueryBuilder('action')
        .select('action.actionType', 'actionType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('action.actionType')
        .getRawMany<{ actionType: ModerationActionTypeEnum; count: string }>(),
      this.moderationCaseRepository.count(),
    ]);

    return {
      totalCases,
      statusBreakdown: statusRows.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
      targetTypeBreakdown: targetTypeRows.map((row) => ({
        targetType: row.targetType,
        count: Number(row.count),
      })),
      actionBreakdown: actionRows.map((row) => ({
        actionType: row.actionType,
        count: Number(row.count),
      })),
    };
  }

  private async upsertCase(
    targetType: ModerationTargetTypeEnum,
    targetId: string,
    snapshotFactory: () => Promise<{ reportCount: number; lastReportedAt: Date }>,
  ) {
    const moderationCase =
      (await this.moderationCaseRepository.findOne({
        where: { targetType, postId: targetId },
      })) ?? this.moderationCaseRepository.create({ targetType, postId: targetId });

    const snapshot = await snapshotFactory();
    moderationCase.reportCount = snapshot.reportCount;
    moderationCase.lastReportedAt = snapshot.lastReportedAt;

    if (
      moderationCase.status === ModerationCaseStatusEnum.resolved ||
      moderationCase.status === ModerationCaseStatusEnum.dismissed ||
      moderationCase.status === ModerationCaseStatusEnum.escalated
    ) {
      moderationCase.status = ModerationCaseStatusEnum.open;
      moderationCase.reviewedAt = null;
    }

    return this.moderationCaseRepository.save(moderationCase);
  }
  private async upsertConversationCase(
    targetType: ModerationTargetTypeEnum,
    conversationId: string,
    snapshotFactory: () => Promise<{ reportCount: number; lastReportedAt: Date }>,
  ) {
    const moderationCase =
      (await this.moderationCaseRepository.findOne({
        where: { targetType, conversationId },
      })) ?? this.moderationCaseRepository.create({ targetType, conversationId });

    const snapshot = await snapshotFactory();
    moderationCase.reportCount = snapshot.reportCount;
    moderationCase.lastReportedAt = snapshot.lastReportedAt;

    if (
      moderationCase.status === ModerationCaseStatusEnum.resolved ||
      moderationCase.status === ModerationCaseStatusEnum.dismissed ||
      moderationCase.status === ModerationCaseStatusEnum.escalated
    ) {
      moderationCase.status = ModerationCaseStatusEnum.open;
      moderationCase.reviewedAt = null;
    }

    return this.moderationCaseRepository.save(moderationCase);
  }

  private async upsertCommentCase(
    targetType: ModerationTargetTypeEnum,
    commentId: string,
    snapshotFactory: () => Promise<{ reportCount: number; lastReportedAt: Date }>,
  ) {
    const moderationCase =
      (await this.moderationCaseRepository.findOne({
        where: { targetType, postCommentsId: commentId },
      })) ?? this.moderationCaseRepository.create({ targetType, postCommentsId: commentId });

    const snapshot = await snapshotFactory();
    moderationCase.reportCount = snapshot.reportCount;
    moderationCase.lastReportedAt = snapshot.lastReportedAt;

    if (
      moderationCase.status === ModerationCaseStatusEnum.resolved ||
      moderationCase.status === ModerationCaseStatusEnum.dismissed ||
      moderationCase.status === ModerationCaseStatusEnum.escalated
    ) {
      moderationCase.status = ModerationCaseStatusEnum.open;
      moderationCase.reviewedAt = null;
    }

    return this.moderationCaseRepository.save(moderationCase);
  }

  private async enrichCase(moderationCase: ModerationCase) {
    const detail = await this.getCaseDetail(moderationCase);
    return {
      ...moderationCase,
      // id: moderationCase.id,
      // targetType: moderationCase.targetType,
      // targetId: moderationCase.postId,
      // status: moderationCase.status,
      // reportCount: moderationCase.reportCount,
      // lastReportedAt: moderationCase.lastReportedAt,
      // reviewedAt: moderationCase.reviewedAt,
      // createdAt: moderationCase.createdAt,
      // updatedAt: moderationCase.updatedAt,
      latestAction: detail.actions[0] ?? null,
      targetSummary: detail.targetSummary,
    };
  }

  private async getCaseDetail(moderationCase: ModerationCase) {
    const actions = await this.moderationActionRepository.find({
      where: { caseId: moderationCase.id },
      relations: { moderator: true },
      order: { createdAt: 'DESC' },
    });

    if (moderationCase.targetType === ModerationTargetTypeEnum.post) {
      const reports = await this.postReportRepository.find({
        where: { postId: moderationCase.postId },
        relations: {
          user: { file: true },
          criteriaRows: true,
          post: { user: { file: true }, postFiles: { file: true } },
        },
        order: { createdAt: 'DESC' },
      });
      const post = await this.postService.getPostById(moderationCase.postId);

      return {
        case: moderationCase,
        actions,
        reports: reports.map((report) => this.mapPostEvidence(report)),
        post
      };
    }

    if (moderationCase.targetType === ModerationTargetTypeEnum.comment) {
      const reports = await this.commentReportRepository.find({
        where: { commentId: moderationCase.postCommentsId },
        relations: {
          user: { file: true },
          criteriaRows: true,
          comment: { user: { file: true }, file: true },
        },
        order: { createdAt: 'DESC' },
      });

      const comment =
        reports[0]?.comment ??
        (await this.commentRepository.findOne({
          where: { id: moderationCase.postCommentsId },
          relations: {
            user: { file: true },
            file: true,
          },
        }));

      return {
        case: moderationCase,
        actions,
        reports: reports.map((report) => this.mapCommentEvidence(report)),
        targetSummary: comment
          ? {
            type: 'comment',
            id: comment.id,
            postId: comment.postId,
            parentId: comment.parentId,
            text: comment.text,
            fileUrl: comment.file?.public_url ?? null,
            author: comment.user
              ? {
                id: comment.user.id,
                name: comment.user.name,
                userName: comment.user.user_name,
                fileUrl: comment.user.file?.public_url ?? null,
              }
              : null,
          }
          : null,
      };
    }

    const reports = await this.chatReportRepository.find({
      where: { conversationId: moderationCase.conversationId },
      relations: {
        loggedInUser: { file: true },
        criteriaRows: true,
        conversation: {
          participants: {
            user: { file: true },
          },
          image: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    const conversation =
      reports[0]?.conversation ??
      (await this.conversationRepository.findOne({
        where: { id: moderationCase.conversationId },
        relations: {
          participants: {
            user: { file: true },
          },
          image: true,
        },
      }));

    return {
      case: moderationCase,
      actions,
      reports: reports.map((report) => this.mapChatEvidence(report)),
      targetSummary: conversation
        ? {
          type: 'conversation',
          id: conversation.id,
          title: conversation.title,
          isModerationLocked: conversation.is_moderation_locked,
          participants: (conversation.participants ?? []).map((participant) => ({
            id: participant.user?.id,
            name: participant.user?.name ?? null,
            userName: participant.user?.user_name ?? null,
            fileUrl: participant.user?.file?.public_url ?? null,
          })),
        }
        : null,
    };
  }

  private mapPostEvidence(report: PostReport): ModerationEvidence {
    return {
      id: report.id,
      createdAt: report.createdAt,
      reporter: report.user
        ? {
          id: report.user.id,
          name: report.user.name,
          userName: report.user.user_name,
          fileUrl: report.user.file?.public_url ?? null,
        }
        : null,
      criteria: (report.criteriaRows ?? []).map((row) => row.criteria),
    };
  }

  private mapChatEvidence(report: ChatReport): ModerationEvidence {
    return {
      id: report.id,
      createdAt: report.createdAt,
      reporter: report.loggedInUser
        ? {
          id: report.loggedInUser.id,
          name: report.loggedInUser.name,
          userName: report.loggedInUser.user_name,
          fileUrl: report.loggedInUser.file?.public_url ?? null,
        }
        : null,
      criteria: (report.criteriaRows ?? []).map((row) => row.criteria),
    };
  }

  private mapCommentEvidence(report: CommentReport): ModerationEvidence {
    return {
      id: report.id,
      createdAt: report.createdAt,
      reporter: report.user
        ? {
          id: report.user.id,
          name: report.user.name,
          userName: report.user.user_name,
          fileUrl: report.user.file?.public_url ?? null,
        }
        : null,
      criteria: (report.criteriaRows ?? []).map((row) => row.criteria),
    };
  }

  private async getCaseOrFail(caseId: string) {
    const moderationCase = await this.moderationCaseRepository.findOne({
      where: { id: caseId },
    });

    if (!moderationCase) {
      throw new NotFoundException('Moderation case not found');
    }

    return moderationCase;
  }

  private ensureTargetType(
    moderationCase: ModerationCase,
    expectedType: ModerationTargetTypeEnum,
    actionType: ModerationActionTypeEnum,
  ) {
    if (moderationCase.targetType !== expectedType) {
      throw new BadRequestException(
        `${actionType} is only valid for ${expectedType} cases`,
      );
    }
  }
}
