/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { ConversationParticipant } from 'src/conversation/entities/conversation-participant.entity';
import { ChatRequest } from './entities/chat-request.entity';
import { UpdateChatRequestStatusDto } from './dto/update-chat-request.dto';
import { chat_request_status } from 'src/common/enums/chat-request.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterChatDto } from './dto/filter-chat-request.dto';
import { Message } from 'src/chat/entities/messages.entity';
import { message_status } from 'src/common/enums/message-status.enum';
import { conversation_type } from 'src/common/enums/conversation-type.enum';

@Injectable()
export class ChatRequestService {
    constructor(
        @InjectRepository(ChatRequest)
        private readonly chatRequestRepo: Repository<ChatRequest>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        @InjectRepository(ConversationParticipant)
        private readonly participantRepo: Repository<ConversationParticipant>,

        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
    ) { }

    async get_incoming_requests(paginationDto: PaginationDto, filters?: Partial<FilterChatDto>): Promise<ChatRequest[]> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        return await this.chatRequestRepo.find({
            // where: { receiver_id: filters?.user_id, status: chat_request_status.pending },
            relations: ['sender_user', 'receiver_user', 'sender_user.file', 'receiver_user.file'],
            take: limit,
            skip: skip,
            order: { created_at: 'DESC' },
        });
    }


    async get_outgoing_requests(paginationDto: PaginationDto, filters?: Partial<FilterChatDto>) {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        return this.chatRequestRepo.find({
            // where: { sender_id: filters?.user_id, status: chat_request_status.pending, },
            relations: ['sender_user', 'receiver_user', 'sender_user.file', 'receiver_user.file'],
            take: limit,
            skip: skip,
            order: { created_at: 'DESC', },
        });
    }


    async send_request(sender_id: string, receiver_id: string, message: string) {
        const conversation = await this.conversationRepo.findOne({
            where: [
                { user_one_id: sender_id, user_two_id: receiver_id, type: conversation_type.direct },
                { user_one_id: receiver_id, user_two_id: sender_id, type: conversation_type.direct },
            ],
        });

        if (conversation?.is_active) {
            await this.ensureDirectParticipants(conversation);
            const savedMessage = await this.messageRepo.save({
                conversation_id: conversation.id,
                sender_id,
                text: message.trim(),
                status: message_status.sent,
            });

            return {
                conversation_id: conversation.id,
                message: savedMessage,
            };
        }

        const last_request = await this.chatRequestRepo.findOne({
            where: [
                { sender_id, receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id },
            ],
            order: { created_at: 'DESC' },
        });

        if (last_request?.status === chat_request_status.pending && last_request.sender_id !== sender_id) {
            throw new ForbiddenException('You can reply after accepting the chat request');
        }

        if (last_request?.status === chat_request_status.revoked) {
            throw new ForbiddenException('Chat permission revoked');
        }

        if (last_request?.status === chat_request_status.rejected) {
            const cooldown_hours = 24;
            const diff =
                Date.now() - new Date(last_request.created_at).getTime();

            if (diff < cooldown_hours * 60 * 60 * 1000) {
                throw new BadRequestException(
                    'You can resend request after cooldown'
                );
            }
        }

        const pendingConversation = conversation ?? await this.conversationRepo.save({
            user_one_id: sender_id,
            user_two_id: receiver_id,
            type: conversation_type.direct,
            is_active: false,
            created_by: sender_id,
        });

        await this.ensureDirectParticipants(pendingConversation);

        const directedRequest = await this.chatRequestRepo.findOneBy({
            sender_id,
            receiver_id,
        });

        const request = directedRequest
            ? await this.chatRequestRepo.save({
                ...directedRequest,
                status: chat_request_status.pending,
                conversation_id: pendingConversation.id,
            })
            : await this.chatRequestRepo.save({
                sender_id,
                receiver_id,
                status: chat_request_status.pending,
                conversation_id: pendingConversation.id,
            });

        const savedMessage = await this.messageRepo.save({
            conversation_id: pendingConversation.id,
            sender_id,
            text: message.trim(),
            status: message_status.sent,
        });

        return {
            ...request,
            conversation_id: pendingConversation.id,
            message: savedMessage,
        };
    }


    async requestAcceptOrReject(action_user_id, {
        request_id,
        status,
    }: UpdateChatRequestStatusDto) {
        const request = await this.chatRequestRepo.findOneBy({ id: request_id });

        if (!request)
            throw new BadRequestException('Request not found');

        if (!request.conversation_id)
            throw new BadRequestException('Conversation not found');

        // only receiver can accept / reject
        if (request.receiver_id !== action_user_id) {
            throw new ForbiddenException('Not allowed to update this request');
        }

        // prevent re-processing
        if (request.status !== chat_request_status.pending) {
            // throw new BadRequestException('Request already processed');
        }

        request.status = status;
        await this.chatRequestRepo.save(request);

        // create conversation ONLY when accepted
        let conversation = request.conversation_id
            ? await this.conversationRepo.findOneBy({ id: request.conversation_id })
            : null;

        if (conversation) {
            conversation.is_active = status === chat_request_status.accepted ? true : false;
            conversation.is_chat_request_accepted = status === chat_request_status.accepted ? true : false;
            conversation = await this.conversationRepo.save(conversation);
        } else {
            throw new BadRequestException('Conversation not found');
        }
        return conversation;
    }

    private async ensureDirectParticipants(conversation: Conversation) {
        if (!conversation.user_one_id || !conversation.user_two_id) {
            return;
        }

        const participants = await this.participantRepo.find({
            where: { conversation_id: conversation.id },
            select: ['user_id'],
        });

        const existing = new Set(participants.map((participant) => participant.user_id));
        const missing = [conversation.user_one_id, conversation.user_two_id]
            .filter((userId) => !existing.has(userId))
            .map((userId, index) => ({
                conversation_id: conversation.id,
                user_id: userId,
                is_admin: index === 0,
            }));

        if (missing.length > 0) {
            await this.participantRepo.save(missing);
        }
    }

}
