import { Controller, Post, Body, Param, UseGuards, Put, Delete, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@ApiTags('Conversation')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/conversation')
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all conversations (admin only)' })
    @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
    async getAllConversations(
        @Query('type') type: 'direct' | 'group',
    ): Promise<BaseResponseDto<any[]>> {
        return new BaseResponseDto(await this.conversationService.getAllConversations(type));
    }

    @Get('/:conversationId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiOperation({ summary: 'Get all conversations (admin only)' })
    @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
    async getById(
        @Param('conversationId') conversationId: string,
    ): Promise<BaseResponseDto<any>> {
        return new BaseResponseDto(await this.conversationService.getById(conversationId));
    }

    @Post('new-group')
    @ApiOperation({ summary: 'Create a new group conversation' })
    @ApiResponse({ status: 201, description: 'Group created successfully' })
    async createGroup(@Body() createGroupDto: CreateGroupDto,
        @CurrentUser() user: AuthUser,) {
        return new BaseResponseDto(await this.conversationService.createGroup(createGroupDto, user.userId));
    }

    @Post('group/:conversationId/add-members')
    @ApiOperation({ summary: 'Add a member to a group conversation' })
    @ApiResponse({ status: 201, description: 'Member added successfully' })
    async addMember(
        @Param('conversationId') conversationId: string,
        @Body() addMemberDto: AddMemberDto,
        @CurrentUser() user: AuthUser,
    ) {
        return new BaseResponseDto(await this.conversationService.addMember(conversationId, addMemberDto, user.userId));
    }
    @Post('group/:conversationId/remove-members')
    @ApiOperation({ summary: 'Remove a member to a group conversation' })
    @ApiResponse({ status: 201, description: 'Member added successfully' })
    async removeMember(
        @Param('conversationId') conversationId: string,
        @Body() removeMemberDto: AddMemberDto,
        @CurrentUser() user: AuthUser,
    ) {
        return new BaseResponseDto(await this.conversationService.removeMember(conversationId, removeMemberDto, user.userId));
    }

    @Put('group/:conversationId/members-role-up')
    @ApiOperation({ summary: 'Update a member\'s admin status in a group conversation' })
    @ApiResponse({ status: 200, description: 'Member role updated successfully' })
    async updateMemberAdminStatus(
        @Param('conversationId') conversationId: string,
        @Body() updateMemberDto: UpdateMemberDto,
        @CurrentUser() user: AuthUser,
    ) {
        return new BaseResponseDto(await this.conversationService.updateMemberAdminStatus(conversationId, updateMemberDto.user_id, updateMemberDto.is_admin, user.userId));
    }

    @Put('group/:conversationId')
    @ApiOperation({ summary: 'Update group title/image' })
    @ApiResponse({ status: 200, description: 'Group updated successfully' })
    async updateGroup(
        @Param('conversationId') conversationId: string,
        @Body() updateGroupDto: UpdateGroupDto,
        @CurrentUser() user: AuthUser,
    ) {
        return new BaseResponseDto(await this.conversationService.updateGroup(conversationId, user.userId, updateGroupDto));
    }

    @Delete('group/:conversationId/permanent')
    @ApiOperation({ summary: 'Delete a group conversation' })
    @ApiResponse({ status: 200, description: 'Group deleted successfully' })
    async deleteGroup(
        @Param('conversationId') conversationId: string,
        @CurrentUser() user: AuthUser,
    ) {
        return new BaseResponseDto(await this.conversationService.deleteGroup(conversationId, user.userId));
    }
}
