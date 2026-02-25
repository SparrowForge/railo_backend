import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ChatRequest } from 'src/chat-request/entities/chat-request.entity';

@Injectable()
export class ConversationService {
    constructor(
        @InjectRepository(ChatRequest)
        private readonly chatRequestRepo: Repository<ChatRequest>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>
    ) { }

    async can_chat(conversation_id: string) {
        const convo = await this.conversationRepo.findOneBy({
            id: conversation_id,
            is_active: true,
        });

        if (!convo) throw new ForbiddenException();
    }


    async revoke_chat(conversation_id: string, user_id: string) {
        const conversation = await this.conversationRepo.findOneBy({
            id: conversation_id,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // only participants can revoke
        if (
            conversation.user_one_id !== user_id &&
            conversation.user_two_id !== user_id
        ) {
            throw new ForbiddenException();
        }

        conversation.is_active = false;
        await this.conversationRepo.save(conversation);
    }



}
