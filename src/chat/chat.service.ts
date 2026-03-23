/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Message } from './entities/messages.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendMessageDto } from './dto/send-message.dto';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { ConversationRead } from './entities/conversation-read.entity';
import { ChatListItem } from './dto/chat-list-item.dto';
import { JwtService } from '@nestjs/jwt';
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

        @InjectRepository(ConversationRead)
        private readonly readRepo: Repository<ConversationRead>,

        @InjectRepository(ConversationMute)
        private readonly muteRepo: Repository<ConversationMute>,

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
        // reply validation
        if (dto.reply_to_message_id) {
            const parent = await this.messageRepo.findOneBy({
                id: dto.reply_to_message_id,
                conversation_id,
            });

            if (!parent) {
                throw new BadRequestException('Reply message not found');
            }
        }

        return this.messageRepo.save({
            conversation_id,
            sender_id: user_id,
            text: dto.text,
            reply_to_message_id: dto.reply_to_message_id,
            status: message_status.sent,
        });
    }

    async getOrCreateConversation(user_id: string, other_user_id: string) {
        if (user_id === other_user_id) {
            throw new BadRequestException('You cannot create a conversation with yourself');
        }

        const existingConversation = await this.conversationRepo.findOne({
            where: [
                { user_one_id: user_id, user_two_id: other_user_id },
                { user_one_id: other_user_id, user_two_id: user_id },
            ],
        });

        if (existingConversation) {
            return existingConversation;
        }

        return this.conversationRepo.save({
            user_one_id: user_id,
            user_two_id: other_user_id,
            is_active: false,
        });
    }

    async get_messages(
        paginationDto: PaginationDto,
        filters: Partial<FilterMessageDto>
    ) {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;


        // 1️⃣ conversation validation
        const conversation = await this.conversationRepo.findOneBy({
            id: filters.conversationId,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.user_one_id !== filters.userId &&
            conversation.user_two_id !== filters.userId
        ) {
            throw new ForbiddenException();
        }

        // // 2️⃣ get clear time (if any)
        // const cleared = await this.clearRepo.findOneBy({
        //     conversation_id,
        //     user_id:filters.userId ,
        // });

        // const cleared_at = cleared?.cleared_at;

        // 3️⃣ build query
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversation_id = :conversation_id', { conversation_id: filters.conversationId });

        // if (cleared_at) {
        //     qb.andWhere('m.created_at > :cleared_at', { cleared_at });
        // }

        // if (cursor) {
        //     qb.andWhere('m.created_at < :cursor', { cursor });
        // }

        const messages = await qb
            .orderBy('m.created_at', 'DESC')
            .take(limit)
            .skip(skip)
            .getMany();

        return {
            data: messages.reverse(), // oldest → newest
            next_cursor:
                messages.length > 0
                    ? messages[messages.length - 1].created_at
                    : null,
        };
    }

    // async mark_as_read(conversation_id: string, user_id: string) {
    //     const now = new Date();

    //     const existing = await this.readRepo.findOneBy({
    //         conversation_id,
    //         user_id,
    //     });

    //     if (existing) {
    //         existing.last_read_at = now;
    //         return this.readRepo.save(existing);
    //     }

    //     return this.readRepo.save({
    //         conversation_id,
    //         user_id,
    //         last_read_at: now,
    //     });
    // }


    async get_unread_count(conversation_id: string, user_id: string) {
        const read = await this.readRepo.findOneBy({
            conversation_id,
            user_id,
        });

        // const cleared = await this.clearRepo.findOneBy({
        //     conversation_id,
        //     user_id,
        // });

        const after_time = read?.last_read_at /*?? cleared?.cleared_at*/;

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
        filters: Partial<FilterChatDto>
    ) {
        if (filters.request_status === chat_request_status.pending) {
            return this.get_pending_chat_list(paginationDto, filters);
        }

        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const qb = this.conversationRepo
            .createQueryBuilder('c')
            .innerJoin(
                'rillo_users',
                'u',
                `
                (
                    (c.user_one_id = :user_id AND u.id = c.user_two_id)
                    OR
                    (c.user_two_id = :user_id AND u.id = c.user_one_id)
                )
                `,
                { user_id: filters.userId },
            )
            .leftJoin(UserLocation, 'location', 'location.user_id = u.id')
            .leftJoin(Files, 'file', 'file.id = u.file_id')
            .select([
                'c.id AS conversation_id',
                'c.user_one_id',
                'c.user_two_id',
                'c.is_active',
                'c.updated_at',
                'u.id AS other_user_id',
                'u.user_name AS username',
                'u.name AS full_name',
                'location.latitude AS latitude',
                'location.longitude AS longitude',
                'location.location AS location',
                'location.area AS area',
                'location.city AS city',
                'location.state AS state',
                'location.country AS country',
                'file.public_url AS profile_image',
            ])
            .where('(c.user_one_id = :user_id OR c.user_two_id = :user_id)', {
                user_id: filters.userId,
            })
            .andWhere('c.is_active = :is_active', { is_active: true })
            .orderBy('c.updated_at', 'DESC')
            .take(limit)
            .skip(skip);

        // if (filters.cursor) {
        //     qb.andWhere('c.updated_at < :cursor', { cursor: filters.cursor });
        // }

        const conversations = await qb.getRawMany();

        const result: ChatListItem[] = [];

        for (const row of conversations) {
            const last_message = await this.messageRepo.findOne({
                where: { conversation_id: row.conversation_id },
                order: { created_at: 'DESC' },
            });

            const read = await this.readRepo.findOneBy({
                conversation_id: row.conversation_id,
                user_id: filters.userId,
            });

            const unread_qb = this.messageRepo
                .createQueryBuilder('m')
                .where('m.conversation_id = :conversation_id', {
                    conversation_id: row.conversation_id,
                })
                .andWhere('m.sender_id != :user_id', {
                    user_id: filters.userId,
                });

            if (read?.last_read_at) {
                unread_qb.andWhere('m.created_at > :last_read_at', {
                    last_read_at: read.last_read_at,
                });
            }

            const unread_count = await unread_qb.getCount();

            result.push({
                conversation_id: row.conversation_id,
                other_user_id: row.other_user_id,
                username: row.username,
                full_name: row.full_name,
                last_message,
                unread_count,
                is_active: row.is_active,
                request_status: chat_request_status.accepted,
                location: row.location,
                area: row.area,
                city: row.city,
                state: row.state,
                country: row.country,
                profile_image: row.profile_image
            });
        }

        return {
            data: result,
            next_cursor:
                conversations.length > 0
                    ? conversations[conversations.length - 1].updated_at
                    : null,
        };
    }

    private async get_pending_chat_list(
        paginationDto: PaginationDto,
        filters: Partial<FilterChatDto>,
    ) {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const pendingRequests = await this.chatRequestRepo
            .createQueryBuilder('cr')
            .innerJoin(Conversation, 'c', 'c.id = cr.conversation_id')
            .innerJoin(
                'rillo_users',
                'u',
                `
                (
                    (c.user_one_id = :user_id AND u.id = c.user_two_id)
                    OR
                    (c.user_two_id = :user_id AND u.id = c.user_one_id)
                )
                `,
                { user_id: filters.userId },
            )
            .leftJoin(UserLocation, 'location', 'location.user_id = u.id')
            .leftJoin(Files, 'file', 'file.id = u.file_id')
            .select([
                'cr.id AS request_id',
                'cr.status AS request_status',
                'cr.created_at',
                'cr.updated_at',
                'c.id AS conversation_id',
                'u.id AS other_user_id',
                'u.user_name AS username',
                'u.name AS full_name',
                'location.latitude AS latitude',
                'location.longitude AS longitude',
                'location.location AS location',
                'location.area AS area',
                'location.city AS city',
                'location.state AS state',
                'location.country AS country',
                'file.public_url AS profile_image',
            ])
            .where('(cr.sender_id = :user_id OR cr.receiver_id = :user_id)', {
                user_id: filters.userId,
            })
            .andWhere('cr.status = :status', { status: chat_request_status.pending })
            .andWhere('c.is_active = :is_active', { is_active: false })
            .orderBy('cr.updated_at', 'DESC')
            .take(limit)
            .skip(skip)
            .getRawMany();

        const result: ChatListItem[] = [];

        for (const row of pendingRequests) {
            const last_message = await this.messageRepo.findOne({
                where: { conversation_id: row.conversation_id },
                order: { created_at: 'DESC' },
            });

            const unread_count = await this.messageRepo
                .createQueryBuilder('m')
                .where('m.conversation_id = :conversation_id', {
                    conversation_id: row.conversation_id,
                })
                .andWhere('m.sender_id != :user_id', {
                    user_id: filters.userId,
                })
                .getCount();

            result.push({
                conversation_id: row.conversation_id,
                other_user_id: row.other_user_id,
                username: row.username,
                full_name: row.full_name,
                last_message,
                unread_count,
                is_active: false,
                request_id: row.request_id,
                request_status: row.request_status,
                location: row.location,
                area: row.area,
                city: row.city,
                state: row.state,
                country: row.country,
                profile_image: row.profile_image,
            });
        }

        return {
            data: result,
            next_cursor:
                pendingRequests.length > 0
                    ? pendingRequests[pendingRequests.length - 1].updated_at
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

        // OPTIONAL but recommended (comment out if you want max speed)
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
        const conversation = await this.conversationRepo.findOneBy({
            id: conversation_id,
        });

        this.ensureConversationParticipant(conversation, user_id);
        return true;
    }

    async validateConversationMessagingAccess(
        conversation_id: string,
        user_id: string,
    ): Promise<boolean> {
        const conversation = await this.conversationRepo.findOneBy({
            id: conversation_id,
        });

        this.ensureConversationParticipant(conversation, user_id);
        const existingConversation = conversation as Conversation;

        if (existingConversation.is_active) {
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

    private ensureConversationParticipant(
        conversation: Conversation | null,
        user_id: string,
    ) {
        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (
            conversation.user_one_id !== user_id &&
            conversation.user_two_id !== user_id
        ) {
            throw new ForbiddenException('Not part of this conversation');
        }
    }

    private async resolveConversationForMessage(
        dto: SendMessageDto,
        user_id: string,
    ): Promise<string> {
        const conversation = await this.conversationRepo.findOneBy({
            id: dto.conversation_id,
        });

        this.ensureConversationParticipant(conversation, user_id);
        const existingConversation = conversation as Conversation;
        const receiver_id = existingConversation.user_one_id === user_id
            ? existingConversation.user_two_id
            : existingConversation.user_one_id;

        if (existingConversation.is_active) {
            return existingConversation.id;
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

            if (!latestRequest.conversation_id && existingConversation) {
                latestRequest.conversation_id = existingConversation.id;
                await this.chatRequestRepo.save(latestRequest);
            }

            const conversation_id = latestRequest.conversation_id ?? existingConversation?.id;

            if (!conversation_id) {
                throw new BadRequestException('Pending chat request has no conversation');
            }

            return conversation_id;
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

        const pendingConversation = existingConversation ?? await this.conversationRepo.save({
            user_one_id: user_id,
            user_two_id: receiver_id,
            is_active: false,
        });

        const directedRequest = await this.chatRequestRepo.findOneBy({
            sender_id: user_id,
            receiver_id,
        });

        if (directedRequest) {
            directedRequest.status = chat_request_status.pending;
            directedRequest.conversation_id = pendingConversation.id;
            await this.chatRequestRepo.save(directedRequest);
        } else {
            await this.chatRequestRepo.save({
                sender_id: user_id,
                receiver_id,
                status: chat_request_status.pending,
                conversation_id: pendingConversation.id,
            });
        }

        return pendingConversation.id;
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
        const conversation = await this.conversationRepo.findOneBy({
            id: conversation_id,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        if (conversation.user_one_id === current_user_id) {
            return conversation.user_two_id;
        }

        if (conversation.user_two_id === current_user_id) {
            return conversation.user_one_id;
        }

        throw new ForbiddenException(
            'User is not part of this conversation',
        );
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

}
