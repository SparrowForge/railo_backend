import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { Conversation } from './entities/conversation.entity';
import { ChatRequest } from 'src/chat-request/entities/chat-request.entity';
import { conversation_type } from 'src/common/enums/conversation-type.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class ConversationService {
    constructor(
        @InjectRepository(ChatRequest)
        private readonly chatRequestRepo: Repository<ChatRequest>,

        @InjectRepository(ConversationParticipant)
        private readonly conversationParticipantRepo: Repository<ConversationParticipant>,

        @InjectRepository(Conversation)
        private readonly conversationRepo: Repository<Conversation>,

        private readonly dataSource: DataSource,
    ) { }

    private hasAtLeastOneAdmin(
        members: Array<{ is_admin?: boolean }>,
    ): boolean {
        return members.some((member) => member.is_admin === true);
    }

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
        const participant = await this.conversationParticipantRepo.findOneBy({
            conversation_id,
            user_id,
        });

        if (!participant) {
            throw new ForbiddenException();
        }

        conversation.is_active = false;
        await this.conversationRepo.save(conversation);
    }

    async createGroup(createGroupDto: CreateGroupDto, creatorId: string) {
        const { title, image_id, members } = createGroupDto;

        // Create the conversation
        const conversationData = {
            type: conversation_type.group,
            title,
            image_id: image_id,
            created_by: creatorId,
            is_active: true,
        };

        const savedConversation = await this.conversationRepo.save(conversationData);

        // Add creator as admin
        const creatorParticipant = this.conversationParticipantRepo.create({
            conversation_id: savedConversation.id,
            user_id: creatorId,
            is_admin: true,
        });

        await this.conversationParticipantRepo.save(creatorParticipant);

        // Add other members
        if (members && members.length > 0) {
            for (const member of members) {
                if (member.user_id !== creatorId) { // Avoid duplicate
                    const participant = this.conversationParticipantRepo.create({
                        conversation_id: savedConversation.id,
                        user_id: member.user_id,
                        is_admin: member.is_admin || false,
                    });
                    await this.conversationParticipantRepo.save(participant);
                }
            }
        }

        return savedConversation;
    }

    async addMember(conversationId: string, addMemberDto: AddMemberDto, requesterId: string) {
        // Check if conversation exists and is active
        const conversation = await this.conversationRepo.findOneBy({
            id: conversationId,
            // is_active: true,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if requester is admin
        const requesterParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: requesterId,
        });

        if (!requesterParticipant || !requesterParticipant.is_admin) {
            throw new ForbiddenException('Only admins can add members');
        }

        // Check if user is already a member
        const existingParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: addMemberDto.user_id,
        });

        if (existingParticipant) {
            throw new ForbiddenException('User is already a member');
        }

        // Add the member
        const newParticipant = this.conversationParticipantRepo.create({
            conversation_id: conversationId,
            user_id: addMemberDto.user_id,
            is_admin: addMemberDto.is_admin || false,
        });

        return await this.conversationParticipantRepo.save(newParticipant);
    }

    async removeMember(conversationId: string, addMemberDto: AddMemberDto, requesterId: string) {
        // Check if conversation exists and is active
        const conversation = await this.conversationRepo.findOneBy({
            id: conversationId,
            // is_active: true,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if requester is admin
        const requesterParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: requesterId,
        });

        if (!requesterParticipant || !requesterParticipant.is_admin) {
            throw new ForbiddenException('Only admins can add members');
        }

        // Check if user is already a member
        const existingParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: addMemberDto.user_id,
        });

        if (existingParticipant) {
            if (existingParticipant.is_admin) {
                const adminCount = await this.conversationParticipantRepo.countBy({
                    conversation_id: conversationId,
                    is_admin: true,
                });

                if (adminCount <= 1) {
                    throw new ForbiddenException('Group must have at least one admin member');
                }
            }

            return await this.conversationParticipantRepo.delete({ id: existingParticipant.id });
        } else {
            throw new ForbiddenException('User is not a member');
        }
    }

    async updateMemberAdminStatus(conversationId: string, targetUserId: string, isAdmin: boolean, requesterId: string) {
        // Check if conversation exists and is active
        const conversation = await this.conversationRepo.findOneBy({
            id: conversationId,
            is_active: true,
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check if requester is admin
        const requesterParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: requesterId,
        });

        if (!requesterParticipant || !requesterParticipant.is_admin) {
            throw new ForbiddenException('Only admins can update member roles');
        }

        // Find the target participant
        const targetParticipant = await this.conversationParticipantRepo.findOneBy({
            conversation_id: conversationId,
            user_id: targetUserId,
        });

        if (!targetParticipant) {
            throw new NotFoundException('User is not a member of this conversation');
        }

        if (targetParticipant.is_admin && !isAdmin) {
            const adminCount = await this.conversationParticipantRepo.countBy({
                conversation_id: conversationId,
                is_admin: true,
            });

            if (adminCount <= 1) {
                throw new ForbiddenException('Group must have at least one admin member');
            }
        }

        // Update the admin status
        targetParticipant.is_admin = isAdmin;
        return await this.conversationParticipantRepo.save(targetParticipant);
    }

    async updateGroup(conversationId: string, requesterId: string, updateGroupDto: UpdateGroupDto) {
        return await this.dataSource.transaction(async (manager) => {
            const conversation = await manager.findOne(Conversation, {
                where: {
                    id: conversationId,
                    type: conversation_type.group,
                    is_active: true,
                },
            });

            if (!conversation) {
                throw new NotFoundException('Group conversation not found');
            }

            const requesterParticipant = await manager.findOne(ConversationParticipant, {
                where: {
                    conversation_id: conversationId,
                    user_id: requesterId,
                },
            });

            if (!requesterParticipant || !requesterParticipant.is_admin) {
                throw new ForbiddenException('Only admins can update group metadata');
            }

            if (updateGroupDto.title !== undefined) {
                conversation.title = updateGroupDto.title;
            }
            if (updateGroupDto.image_id !== undefined) {
                conversation.image_id = updateGroupDto.image_id;
            }

            const savedConversation = await manager.save(Conversation, conversation);

            if (updateGroupDto.members !== undefined) {
                const uniqueMembers = Array.from(
                    new Map(
                        updateGroupDto.members.map((member) => [
                            member.user_id,
                            {
                                conversation_id: conversationId,
                                user_id: member.user_id,
                                is_admin: member.is_admin || false,
                            },
                        ]),
                    ).values(),
                );

                if (!this.hasAtLeastOneAdmin(uniqueMembers)) {
                    throw new ForbiddenException('Group must have at least one admin member');
                }

                await manager.delete(ConversationParticipant, { conversation_id: conversationId });
                await manager.save(ConversationParticipant, uniqueMembers);
            }

            return savedConversation;
        });
    }

    async deleteGroup(conversationId: string, requesterId: string) {
        return await this.dataSource.transaction(async (manager) => {
            const conversation = await manager.findOne(Conversation, {
                where: { id: conversationId },
                withDeleted: true,
            });

            if (!conversation) {
                throw new NotFoundException('Group conversation not found');
            }

            // Check if requester is admin
            const participant = await manager.findOne(ConversationParticipant, {
                where: {
                    conversation_id: conversationId,
                    user_id: requesterId,
                },
            });

            if (!participant || !participant.is_admin) {
                throw new ForbiddenException('Only admins can delete the group');
            }

            // Delete participants
            await manager.delete(ConversationParticipant, { conversation_id: conversationId });

            // Hard delete conversation
            await manager.delete(Conversation, { id: conversationId });
        });
    }

    async getAllConversations(type?: 'direct' | 'group') {
        if (type === 'direct') {
            return await this.conversationRepo.find({
                where: { type: conversation_type.direct, is_active: true },
                relations: ['user_one', 'user_one.file', 'user_two', 'user_two.file'],
            });
        } else if (type === 'group') {
            return await this.conversationRepo.find({
                where: { type: conversation_type.group, is_active: true },
                relations: ['participants', 'participants.user', 'participants.user.file'],
            });
        } else {
            // Get all
            const direct = await this.conversationRepo.find({
                where: { type: conversation_type.direct, is_active: true },
                relations: ['user_one', 'user_one.file', 'user_two', 'user_two.file'],
            });
            const groups = await this.conversationRepo.find({
                where: { type: conversation_type.group, is_active: true },
                relations: ['participants', 'participants.user', 'participants.user.file'],
            });
            return [...direct, ...groups];
        }
    }

    async getById(conversationId: string) {
        return await this.conversationRepo.findOne({
            where: { id: conversationId },
            relations: ['user_one', 'user_two', 'participants', 'participants.user', 'participants.user.file', 'image'],
        });
    }

}
