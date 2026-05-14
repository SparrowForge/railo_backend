import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterChatDto } from './dto/filter-chat-list.dto';
import { FilterMessageDto } from './dto/filter-message.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { ReadAllChatRequestDto } from './dto/read-all-char-req.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { GetOrCreateConversationDto } from './dto/get-or-create-conversation.dto';
import { CreateChatReportDto } from './dto/create-chat-report.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('get-chat-list')
    @ApiOperation({ summary: 'Get all chat with pagination and filters', description: 'Retrieves a paginated list of all active chat with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getChatList(@Query() filters: FilterChatDto) {
        const { page, limit, ...chatFilters } = filters;
        const pagination = { page, limit };
        const chat = await this.chatService.get_chat_list(pagination, chatFilters);
        return new BaseResponseDto(chat, 'Chat list retrieved successfully');
    }

    @Get('get-messages')
    @ApiOperation({ summary: 'Get all chat with pagination and filters', description: 'Retrieves a paginated list of all active chat with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getMessages(@Query() filters: FilterMessageDto) {
        const { page, limit, ...chatFilters } = filters;
        const pagination = { page, limit };
        const chat = await this.chatService.get_messages(pagination, chatFilters);
        return new BaseResponseDto(chat, 'Chat list retrieved successfully');
    }

    @Post('get-or-create-conversation')
    @ApiOperation({ summary: 'Get or create conversation with another user' })
    @ApiResponse({ status: 201, description: 'Conversation retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getOrCreateConversation(
        @CurrentUser() user: AuthUser,
        @Body() dto: GetOrCreateConversationDto,
    ) {
        const conversation = await this.chatService.getOrCreateConversation(
            user.userId,
            dto.user_id,
        );

        return new BaseResponseDto(conversation, 'Conversation retrieved successfully');
    }

    @Post('create-group-conversation')
    @ApiOperation({ summary: 'Create a group conversation' })
    @ApiResponse({ status: 201, description: 'Group conversation created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async createGroupConversation(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateGroupConversationDto,
    ) {
        const conversation = await this.chatService.createGroupConversation(
            user.userId,
            dto,
        );

        return new BaseResponseDto(conversation, 'Group conversation created successfully');
    }

    @Post('mark-as-read')
    @ApiOperation({ summary: 'Read all chat', description: 'Read all chat', })
    @ApiResponse({ status: 201, description: 'Read all chat successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async markAsRead(@CurrentUser() user: AuthUser, @Body() readAllChat: ReadAllChatRequestDto) {
        await this.chatService.markConversationAsRead(readAllChat.conversationId, user.userId);
        await this.chatService.markMessagesAsRead(readAllChat.conversationId, user.userId);
        return new BaseResponseDto('All message mark as read successfully in this conversation');
    }

    @Post(':conversationId/toggle-pin')
    @ApiOperation({ summary: 'Toggle pin a conversation' })
    @ApiResponse({ status: 200, description: 'Conversation pin toggled successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async toggleConversationPin(
        @CurrentUser() user: AuthUser,
        @Param('conversationId') conversationId: string,
    ) {
        const res = await this.chatService.toggleConversationPin(conversationId, user.userId);
        return new BaseResponseDto(res, 'Conversation pin toggled successfully');
    }

    @Post(':conversationId/report')
    @ApiOperation({ summary: 'Report a conversation', description: 'Report a conversation with one or more predefined criteria.' })
    @ApiResponse({ status: 200, description: 'Chat reported successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Conversation not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async reportChat(
        @CurrentUser() user: AuthUser,
        @Param('conversationId') conversationId: string,
        @Body() createChatReportDto: CreateChatReportDto,
    ) {
        const res = await this.chatService.reportChat(conversationId, user.userId, createChatReportDto);
        return new BaseResponseDto(res, 'Chat reported successfully');
    }

    @Post(':targetUserId/user-hide')
    @ApiOperation({ summary: 'userHide', description: 'userHide' })
    @ApiResponse({ status: 200, description: 'userHide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'User not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async userHide(@CurrentUser() user: AuthUser, @Param('targetUserId') targetUserId: string) {
        const res = await this.chatService.userHide(targetUserId, user.userId);
        return new BaseResponseDto(res, 'User hide successfully');
    }

    @Post(':targetUserId/user-unhide')
    @ApiOperation({ summary: 'userUnHide', description: 'userUnHide' })
    @ApiResponse({ status: 200, description: 'userUnHide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'User not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async userUnHide(@CurrentUser() user: AuthUser, @Param('targetUserId') targetUserId: string) {
        const res = await this.chatService.userUnHide(targetUserId, user.userId);
        return new BaseResponseDto(res, 'User unhide successfully');
    }
}


