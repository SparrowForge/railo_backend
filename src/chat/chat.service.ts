/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { In, Repository } from 'typeorm';
import { Message } from './entities/messages.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { ConversationRead } from './entities/conversation-read.entity';
import { ChatListItem } from './dto/chat-list-item.dto';
import { ConversationMute } from './entities/conversation-mute.entity';
import { User } from 'src/users/entities/user.entity';
import { UserPresenceService } from './services/user-presence.service';
import { message_status } from 'src/common/enums/message-status.enum';
import { FilterChatDto } from './dto/filter-chat-list.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterMessageDto } from './dto/filter-message.dto';
import { UserLocation } from 'src/user-location/entities/user-location.entity';
import { Files } from 'src/files/entities/file.entity';
import { ChatRequest } from 'src/chat-request/entities/chat-request.entity';
import { chat_request_status } from 'src/common/enums/chat-request.enum';
import { conversation_type } from 'src/common/enums/conversation-type.enum';
import { ConversationParticipant } from 'src/conversation/entities/conversation-participant.entity';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(ChatRequest)
        private readonly chatRequestRepo: Repository<ChatRequest>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        @InjectRepository(ConversationParticipant)
        private readonly participantRepo: Repository<ConversationParticipant>,

        @InjectRepository(ConversationRead)
        private readonly readRepo: Repository<ConversationRead>,

        @InjectRepository(ConversationMute)
        private readonly muteRepo: Repository<ConversationMute>,

        @InjectRepository(Files)
        private readonly fileRepo: Repository<Files>,

        private readonly jwtService: JwtService,

        private readonly userPresenceService: UserPresenceService,
    ) { }

    async send_message(dto: SendMessageDto, user_id: string) {
        const conversation_id = await this.resolveConversationForMessage(dto, user_id);
        const isValidConversation = await this.validateConversationMessagingAccess(
            conversation_id,
            user_id,
        );
        if (!isValidConversation) {
            throw new BadRequestException('Invalid conversation');
        }

        if (dto.reply_to_message_id) {
            const parent = await this.messageRepo.findOneBy({
                id: dto.reply_to_message_id,
                conversation_id,
            });

            if (!parent) {
                throw new BadRequestException('Reply message not found');
            }
        }

        const message = await this.messageRepo.save({
            conversation_id,
            sender_id: user_id,
            text: dto.text,
            reply_to_message_id: dto.reply_to_message_id,
            status: message_status.sent,
            file_ids: dto.file_ids ?? null,
        });

        if (message.file_ids?.length) {
            message.files = await this.fileRepo.findBy({
                id: In(message.file_ids),
            });
        }

        return message;
    }

    async getOrCreateConversation(user_id: string, other_user_id: string) {
        if (user_id === other_user_id) {
            throw new BadRequestException('You cannot create a conversation with yourself');
        }

        const existingConversation = await this.conversationRepo.findOne({
            where: [
                { user_one_id: user_id, user_two_id: other_user_id, type: conversation_type.direct },
                { user_one_id: other_user_id, user_two_id: user_id, type: conversation_type.direct },
            ],
        });

        if (existingConversation) {
            await this.ensureDirectConversationParticipants(existingConversation);
            return existingConversation;
        }

        const conversation = await this.conversationRepo.save({
            user_one_id: user_id,
            user_two_id: other_user_id,
            type: conversation_type.direct,
            is_active: false,
            created_by: user_id,
        });

        await this.participantRepo.save([
            {
                conversation_id: conversation.id,
                user_id,
                is_admin: true,
            },
            {
                conversation_id: conversation.id,
                user_id: other_user_id,
                is_admin: false,
            },
        ]);

        return conversation;
    }

    async createGroupConversation(
        creator_id: string,
        dto: CreateGroupConversationDto,
    ) {
        const uniqueParticipantIds = [...new Set(dto.participant_ids)];
        const participantIds = [...new Set([creator_id, ...uniqueParticipantIds])];

        if (participantIds.length < 2) {
            throw new BadRequestException('A group conversation needs at least 2 participants');
        }

        const users = await this.userRepo.find({
            where: { id: In(participantIds) },
            select: ['id'],
        });

        if (users.length !== participantIds.length) {
            throw new BadRequestException('One or more participants were not found');
        }

        const conversation = await this.conversationRepo.save({
            type: conversation_type.group,
            title: dto.title.trim(),
            file_id: dto.file_id,
            created_by: creator_id,
            is_active: true,
        });

        await this.participantRepo.save(
            participantIds.map((participantId) => ({
                conversation_id: conversation.id,
                user_id: participantId,
                is_admin: participantId === creator_id,
            })),
        );

        return this.getConversationWithParticipants(conversation.id);
    }

    async get_messages(
        paginationDto: PaginationDto,
        filters: Partial<FilterMessageDto>,
    ) {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const conversation = await this.getConversationOrFail(filters.conversationId!);
        await this.ensureConversationParticipant(conversation, filters.userId!);

        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversation_id = :conversation_id', { conversation_id: filters.conversationId });

        const messages = await qb
            .orderBy('m.created_at', 'DESC')
            .take(limit)
            .skip(skip)
            .getMany();

        await this.attachFilesToMessages(messages);

        return {
            data: messages.reverse(),
            next_cursor:
                messages.length > 0
                    ? messages[messages.length - 1].created_at
                    : null,
        };
    }

    async get_unread_count(conversation_id: string, user_id: string) {
        const read = await this.readRepo.findOneBy({
            conversation_id,
            user_id,
        });

        const after_time = read?.last_read_at;

        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversation_id = :conversation_id', { conversation_id })
            .andWhere('m.sender_id != :user_id', { user_id });

        if (after_time) {
            qb.andWhere('m.created_at > :after_time', { after_time });
        }

        return qb.getCount();
    }

    async get_chat_list(
        paginationDto: PaginationDto,
        filters: Partial<FilterChatDto>,
    ) {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const isPendingRequestList = filters.request_status === chat_request_status.pending;

        if (isPendingRequestList) {
            const qb = this.conversationRepo
                .createQueryBuilder('c')
                .innerJoin(
                    ChatRequest,
                    'cr',
                    'cr.conversation_id = c.id AND cr.status = :request_status',
                    { request_status: chat_request_status.pending },
                )
                .where('c.type = :type', { type: conversation_type.direct })
                .andWhere('c.is_active = :is_active', { is_active: false })
                .andWhere('(c.user_one_id = :user_id OR c.user_two_id = :user_id)', {
                    user_id: filters.userId,
                })
                .orderBy('c.updated_at', 'DESC')
                .take(limit)
                .skip(skip);

            const conversations = await qb.getMany();
            const data = await Promise.all(
                conversations.map((conversation) =>
                    this.buildChatListItem(conversation, filters.userId!, {
                        request_id: null,
                        request_status: chat_request_status.pending,
                    }),
                ),
            );

            return {
                data,
                next_cursor:
                    conversations.length > 0
                        ? conversations[conversations.length - 1].updated_at
                        : null,
            };
        }

        const conversations = await this.conversationRepo
            .createQueryBuilder('c')
            .innerJoin(
                ConversationParticipant,
                'cp',
                'cp.conversation_id = c.id AND cp.user_id = :user_id',
                { user_id: filters.userId },
            )
            .where('c.is_active = :is_active', { is_active: true })
            .orderBy('c.updated_at', 'DESC')
            .take(limit)
            .skip(skip)
            .getMany();

        const result = await Promise.all(
            conversations.map((conversation) =>
                this.buildChatListItem(conversation, filters.userId!, {
                    request_id: null,
                    request_status: chat_request_status.accepted,
                }),
            ),
        );

        return {
            data: result,
            next_cursor:
                conversations.length > 0
                    ? conversations[conversations.length - 1].updated_at
                    : null,
        };
    }

    async validateSocketUser(token?: string): Promise<{ id: string }> {
        if (!token) {
            throw new Error('No token provided');
        }

        let payload: any;

        try {
            payload = this.jwtService.verify(token);
        } catch {
            throw new Error('Invalid token');
        }

        if (!payload?.sub) {
            throw new Error('Invalid token payload');
        }

        const userExists = await this.userRepo.findOne({
            where: { id: payload.sub },
            select: ['id'],
        });

        if (!userExists) {
            throw new Error('User not found');
        }

        return { id: payload.sub };
    }

    async validateConversationAccess(
        conversation_id: string,
        user_id: string,
    ): Promise<boolean> {
        const conversation = await this.getConversationOrFail(conversation_id);
        await this.ensureConversationParticipant(conversation, user_id);
        return true;
    }

    async validateConversationMessagingAccess(
        conversation_id: string,
        user_id: string,
    ): Promise<boolean> {
        const conversation = await this.getConversationOrFail(conversation_id);
        await this.ensureConversationParticipant(conversation, user_id);

        if (conversation.type === conversation_type.group) {
            if (!conversation.is_active) {
                throw new ForbiddenException('Conversation is inactive');
            }

            return true;
        }

        if (conversation.is_active) {
            return true;
        }

        const pendingRequest = await this.chatRequestRepo.findOne({
            where: { conversation_id, status: chat_request_status.pending },
            order: { created_at: 'DESC' },
        });

        if (!pendingRequest) {
            throw new ForbiddenException('Chat permission revoked');
        }

        if (pendingRequest.sender_id !== user_id) {
            throw new ForbiddenException('You can reply after accepting the chat request');
        }

        return true;
    }

    private async buildChatListItem(
        conversation: Conversation,
        user_id: string,
        requestMeta: {
            request_id: string | null;
            request_status: chat_request_status;
        },
    ): Promise<ChatListItem> {
        const hydratedConversation = await this.getConversationWithParticipants(conversation.id);
        const participants = hydratedConversation.participants ?? [];
        const isGroup = hydratedConversation.type === conversation_type.group;
        const otherParticipant = participants.find((participant) => participant.user_id !== user_id) ?? null;

        const last_message = await this.messageRepo.findOne({
            where: { conversation_id: hydratedConversation.id },
            order: { created_at: 'DESC' },
        });

        const read = await this.readRepo.findOneBy({
            conversation_id: hydratedConversation.id,
            user_id,
        });

        const unread_qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversation_id = :conversation_id', {
                conversation_id: hydratedConversation.id,
            })
            .andWhere('m.sender_id != :user_id', {
                user_id,
            });

        if (read?.last_read_at) {
            unread_qb.andWhere('m.created_at > :last_read_at', {
                last_read_at: read.last_read_at,
            });
        }

        const unread_count = await unread_qb.getCount();
        const otherUser = otherParticipant?.user;
        const otherLocation = otherUser?.id
            ? await this.getUserLocation(otherUser.id)
            : null;

        return {
            conversation_id: hydratedConversation.id,
            type: hydratedConversation.type,
            title: isGroup
                ? hydratedConversation.title
                : (otherUser?.display_name ?? otherUser?.name ?? null),
            image_url: isGroup
                ? hydratedConversation.image?.public_url ?? null
                : (otherUser?.file?.public_url ?? null),
            other_user_id: isGroup ? null : (otherUser?.id ?? null),
            username: isGroup ? null : (otherUser?.user_name ?? null),
            full_name: isGroup ? null : (otherUser?.name ?? null),
            participant_count: participants.length,
            last_message,
            unread_count,
            is_active: hydratedConversation.is_active,
            request_id: requestMeta.request_id,
            request_status: requestMeta.request_status,
            location: otherLocation?.location ?? null,
            area: otherLocation?.area ?? null,
            city: otherLocation?.city ?? null,
            state: otherLocation?.state ?? null,
            country: otherLocation?.country ?? null,
            profile_image: isGroup
                ? hydratedConversation.image?.public_url ?? null
                : (otherUser?.file?.public_url ?? null),
        };
    }

    private async resolveConversationForMessage(
        dto: SendMessageDto,
        user_id: string,
    ): Promise<string> {
        const conversation = await this.getConversationOrFail(dto.conversation_id);
        await this.ensureConversationParticipant(conversation, user_id);

        if (conversation.type === conversation_type.group) {
            if (!conversation.is_active) {
                throw new ForbiddenException('Conversation is inactive');
            }

            return conversation.id;
        }

        const receiver_id = this.getDirectCounterpartId(conversation, user_id);

        if (conversation.is_active) {
            return conversation.id;
        }

        const latestRequest = await this.chatRequestRepo.findOne({
            where: [
                { sender_id: user_id, receiver_id },
                { sender_id: receiver_id, receiver_id: user_id },
            ],
            order: { created_at: 'DESC' },
        });

        if (latestRequest?.status === chat_request_status.pending) {
            if (latestRequest.sender_id !== user_id) {
                throw new ForbiddenException('You can reply after accepting the chat request');
            }

            if (!latestRequest.conversation_id) {
                latestRequest.conversation_id = conversation.id;
                await this.chatRequestRepo.save(latestRequest);
            }

            return latestRequest.conversation_id;
        }

        if (latestRequest?.status === chat_request_status.revoked) {
            throw new ForbiddenException('Chat permission revoked');
        }

        if (latestRequest?.status === chat_request_status.rejected) {
            const cooldown_hours = 24;
            const diff = Date.now() - new Date(latestRequest.created_at).getTime();

            if (diff < cooldown_hours * 60 * 60 * 1000) {
                throw new BadRequestException('You can resend request after cooldown');
            }
        }

        const directedRequest = await this.chatRequestRepo.findOneBy({
            sender_id: user_id,
            receiver_id,
        });

        if (directedRequest) {
            directedRequest.status = chat_request_status.pending;
            directedRequest.conversation_id = conversation.id;
            await this.chatRequestRepo.save(directedRequest);
        } else {
            await this.chatRequestRepo.save({
                sender_id: user_id,
                receiver_id,
                status: chat_request_status.pending,
                conversation_id: conversation.id,
            });
        }

        return conversation.id;
    }

    async touchConversation(conversation_id: string) {
        await this.conversationRepo.update(
            { id: conversation_id },
            { updated_at: new Date() },
        );
    }

    async markConversationAsRead(
        conversation_id: string,
        user_id: string,
    ) {
        const now = new Date();

        const existing = await this.readRepo.findOneBy({
            conversation_id,
            user_id,
        });

        if (existing) {
            existing.last_read_at = now;
            return this.readRepo.save(existing);
        }

        return this.readRepo.save({
            conversation_id,
            user_id,
            last_read_at: now,
        });
    }

    async muteConversation(
        conversation_id: string,
        user_id: string,
        muted_until?: Date,
    ) {
        const existing = await this.muteRepo.findOneBy({
            conversation_id,
            user_id,
        });

        if (existing) {
            existing.muted_until = muted_until;
            return this.muteRepo.save(existing);
        }

        return this.muteRepo.save({
            conversation_id,
            user_id,
            muted_until,
        });
    }

    async isMuted(conversation_id: string, user_id: string): Promise<boolean> {
        const mute = await this.muteRepo.findOneBy({
            conversation_id,
            user_id,
        });

        if (!mute) return false;
        if (!mute.muted_until) return true;

        return mute.muted_until > new Date();
    }

    async getOtherUserId(
        conversation_id: string,
        current_user_id: string,
    ): Promise<string> {
        const conversation = await this.getConversationOrFail(conversation_id);

        if (conversation.type !== conversation_type.direct) {
            throw new BadRequestException('Group conversations do not have a single other user');
        }

        return this.getDirectCounterpartId(conversation, current_user_id);
    }

    async getConversationRecipientIds(
        conversation_id: string,
        current_user_id: string,
    ): Promise<string[]> {
        const conversation = await this.getConversationWithParticipants(conversation_id);
        await this.ensureConversationParticipant(conversation, current_user_id);

        return (conversation.participants ?? [])
            .map((participant) => participant.user_id)
            .filter((participantId) => participantId !== current_user_id);
    }

    async getUserPresence(user_id: string) {
        const user = await this.userRepo.findOne({
            where: { id: user_id },
            select: ['id', 'last_seen_at'],
        });

        if (!user) throw new NotFoundException();

        const is_online = this.userPresenceService.isUserOnline(user_id);

        return {
            user_id,
            is_online,
            last_seen_at: is_online ? null : user.last_seen_at,
        };
    }

    async markMessagesAsRead(
        conversation_id: string,
        user_id: string,
    ) {
        await this.messageRepo
            .createQueryBuilder()
            .update()
            .set({ status: message_status.read })
            .where('conversation_id = :conversation_id', { conversation_id })
            .andWhere('sender_id != :user_id', { user_id })
            .andWhere('status != :status', {
                status: message_status.read,
            })
            .execute();
    }

    private async getConversationOrFail(conversation_id: string): Promise<Conversation> {
        const conversation = await this.conversationRepo.findOneBy({
            id: conversation_id,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    private async getConversationWithParticipants(conversation_id: string): Promise<Conversation> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversation_id },
            relations: {
                participants: {
                    user: {
                        file: true,
                    },
                },
                image: true,
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    private async ensureConversationParticipant(
        conversation: Conversation | null,
        user_id: string,
    ) {
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        const participant = await this.participantRepo.findOneBy({
            conversation_id: conversation.id,
            user_id,
        });

        if (participant) {
            return;
        }

        if (
            conversation.type === conversation_type.direct &&
            (conversation.user_one_id === user_id || conversation.user_two_id === user_id)
        ) {
            await this.ensureDirectConversationParticipants(conversation);
            return;
        }

        throw new ForbiddenException('Not part of this conversation');
    }

    private async ensureDirectConversationParticipants(conversation: Conversation) {
        if (
            conversation.type !== conversation_type.direct ||
            !conversation.user_one_id ||
            !conversation.user_two_id
        ) {
            return;
        }

        const existingParticipants = await this.participantRepo.find({
            where: { conversation_id: conversation.id },
            select: ['user_id'],
        });

        const existingUserIds = new Set(existingParticipants.map((participant) => participant.user_id));
        const participantsToCreate = [conversation.user_one_id, conversation.user_two_id]
            .filter((userId) => !existingUserIds.has(userId))
            .map((userId, index) => ({
                conversation_id: conversation.id,
                user_id: userId,
                is_admin: index === 0,
            }));

        if (participantsToCreate.length > 0) {
            await this.participantRepo.save(participantsToCreate);
        }
    }

    private getDirectCounterpartId(
        conversation: Conversation,
        current_user_id: string,
    ): string {
        if (conversation.user_one_id === current_user_id && conversation.user_two_id) {
            return conversation.user_two_id;
        }

        if (conversation.user_two_id === current_user_id && conversation.user_one_id) {
            return conversation.user_one_id;
        }

        throw new ForbiddenException('User is not part of this conversation');
    }

    private async getUserLocation(user_id: string) {
        return this.userRepo.manager.findOne(UserLocation, {
            where: { user_id },
        });
    }

    private async attachFilesToMessages(messages: Message[]) {
        const fileIds = [...new Set(
            messages.flatMap((message) => message.file_ids ?? []),
        )];

        if (fileIds.length === 0) {
            return;
        }

        const files = await this.fileRepo.findBy({
            id: In(fileIds),
        });
        const fileMap = new Map(files.map((file) => [file.id, file]));

        for (const message of messages) {
            message.files = (message.file_ids ?? [])
                .map((fileId) => fileMap.get(fileId))
                .filter((file): file is Files => Boolean(file));
        }
    }
}
