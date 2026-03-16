/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { ChatRequest } from './entities/chat-request.entity';
import { UpdateChatRequestStatusDto } from './dto/update-chat-request.dto';
import { chat_request_status } from 'src/common/enums/chat-request.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FilterChatDto } from './dto/filter-chat-request.dto';

@Injectable()
export class ChatRequestService {
    constructor(
        @InjectRepository(ChatRequest)
        private readonly chatRequestRepo: Repository<ChatRequest>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>
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


    async send_request(sender_id: string, receiver_id: string) {
        // 1. check active conversation
        const conversation = await this.conversationRepo.findOne({
            where: [
                { user_one_id: sender_id, user_two_id: receiver_id },
                { user_one_id: receiver_id, user_two_id: sender_id },
            ],
        });

        if (conversation && conversation.is_active) {
            throw new BadRequestException('Chat already allowed');
        }

        // 2. latest request between users
        const last_request = await this.chatRequestRepo.findOne({
            where: [
                { sender_id, receiver_id },
                { sender_id: receiver_id, receiver_id: sender_id },
            ],
            order: { created_at: 'DESC' },
        });

        if (last_request) {
            if (last_request.status === chat_request_status.pending) {
                throw new BadRequestException('Request already pending');
            }

            if (last_request.status === chat_request_status.rejected) {
                const cooldown_hours = 24;
                const diff =
                    Date.now() - new Date(last_request.created_at).getTime();

                if (diff < cooldown_hours * 60 * 60 * 1000) {
                    throw new BadRequestException(
                        'You can resend request after cooldown'
                    );
                }
            }

            if (last_request.status === chat_request_status.revoked) {
                throw new ForbiddenException('Chat permission revoked');
            }
        }

        return this.chatRequestRepo.save({ sender_id, receiver_id });
    }


    async requestAcceptOrReject(action_user_id, {
        request_id,
        status,
    }: UpdateChatRequestStatusDto) {
        const request = await this.chatRequestRepo.findOneBy({ id: request_id });

        if (!request) {
            throw new BadRequestException('Request not found');
        }

        // only receiver can accept / reject
        if (request.receiver_id !== action_user_id) {
            throw new ForbiddenException('Not allowed to update this request');
        }

        // prevent re-processing
        if (request.status !== chat_request_status.pending) {
            throw new BadRequestException('Request already processed');
        }

        request.status = status;
        await this.chatRequestRepo.save(request);

        // create conversation ONLY when accepted
        if (status === chat_request_status.accepted) {
            const existing = await this.conversationRepo.findOne({
                where: [
                    { user_one_id: request.sender_id, user_two_id: request.receiver_id },
                    { user_one_id: request.receiver_id, user_two_id: request.sender_id },
                ],
            });

            if (existing) {
                return existing;
            }

            return this.conversationRepo.save({
                user_one_id: request.sender_id,
                user_two_id: request.receiver_id,
                is_active: true,
            });
        }

        // rejected → end flow
        return {
            message: 'Request rejected successfully',
        };
    }

}
