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

    @Post(':targetUserId/report')
    @ApiOperation({ summary: 'Report a chat user', description: 'Report a chat user with one or more predefined criteria.' })
    @ApiResponse({ status: 200, description: 'Chat reported successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'User not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async reportChat(
        @CurrentUser() user: AuthUser,
        @Param('targetUserId') targetUserId: string,
        @Body() createChatReportDto: CreateChatReportDto,
    ) {
        const res = await this.chatService.reportChat(targetUserId, user.userId, createChatReportDto);
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

    // @Post()
    // @ApiOperation({
    //     summary: 'Create a new chat', description: 'Creates a new chat with the provided information. Password will be hashed before saving. Requires authentication.',
    // })
    // @ApiResponse({ status: 201, description: 'Chat created successfully', type: BaseResponseDto<Chat>, })
    // @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async create(@CurrentUser() user: AuthUser, @Body() createChatDto: CreateChatDto) {
    //     createChatDto.created_by = user.userId;
    //     const chat = await this.chatService.create(createChatDto);
    //     return new BaseResponseDto(chat, 'Chat created successfully');
    // }

    // @Get()
    // @ApiOperation({ summary: 'Get all chat with pagination and filters', description: 'Retrieves a paginated list of all active chat with optional filtering by role, department, and search terms. Requires authentication.', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async findAll(@Query() filters: FilterChatDto) {
    //     const { page, limit, ...chatFilters } = filters;
    //     const pagination = { page, limit };
    //     const chat = await this.chatService.findAll(pagination, chatFilters);
    //     return new BaseResponseDto(chat, 'Chat retrieved successfully');
    // }

    // @Get(':id')
    // @ApiOperation({ summary: 'Get a chat by id', description: 'Retrieves a specific chat by their ID. Only returns active chat (soft-deleted chat are excluded). Requires authentication.', })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'string', })
    // @ApiResponse({ status: 200, description: 'Chat retrieved successfully', type: BaseResponseDto<Chat>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async findOne(@Param('id') id: string) {
    //     const chat = await this.chatService.findOne(id);
    //     return new BaseResponseDto(chat, 'Chat retrieved successfully');
    // }

    // @Patch(':id')
    // @ApiOperation({ summary: 'Update a chat by id', description: 'Updates an existing chat with the provided information. Only active chat can be updated. Requires authentication.', })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'number', })
    // @ApiResponse({ status: 200, description: 'Chat updated successfully', type: BaseResponseDto<Chat>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() updateChatDto: UpdateChatDto,) {
    //     updateChatDto.updated_by = user.userId;
    //     const chat = await this.chatService.update(id, updateChatDto);
    //     return new BaseResponseDto(chat, 'Chat updated successfully');
    // }

    // @Patch(':id/approve-status/:status')
    // @Roles(RolesEnum.ADMIN)
    // @ApiOperation({ summary: 'Update a chat status by word id and status enum. Admin only.', description: 'Updates an existing chat with the provided information. Only active chat can be updated. Requires authentication.', })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'number', })
    // @ApiResponse({ status: 200, description: 'Chat updated successfully', type: BaseResponseDto<Chat>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async approved(
    //     @CurrentUser() user: AuthUser,
    //     @Param('id') id: string,
    //     @Param(
    //         'status',
    //         new ParseEnumPipe(ChattatusEnum, {
    //             errorHttpStatusCode: 400,
    //             exceptionFactory: () => {
    //                 return new BadRequestException(
    //                     `status must be one of: ${Object.values(ChattatusEnum).join(', ')}`,
    //                 );
    //             },
    //         }),
    //     ) status: ChattatusEnum,) {
    //     const approved_by_user_id = user.userId;
    //     const chat = await this.chatService.updateApprovalStatus(id, status, approved_by_user_id);
    //     return new BaseResponseDto(chat, 'Chat updated successfully');
    // }

    // @Delete(':id')
    // @ApiOperation({
    //     summary: 'Soft delete a chat by id',
    //     description: 'Soft deletes a chat by setting the deletedAt timestamp. The chat will not appear in regular queries but can be restored. Requires authentication.',
    // })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: 1, type: 'number', })
    // @ApiResponse({ status: 200, description: 'Chat soft deleted successfully', type: BaseResponseDto<null>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    //     await this.chatService.remove(id);
    //     return new BaseResponseDto(null, 'Chat soft deleted successfully');
    // }

    // @Delete(':id/permanent')
    // @ApiOperation({ summary: 'Permanently delete a chat by id', description: 'Permanently deletes a chat from the database. This action cannot be undone. Requires authentication.', })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: 1, type: 'number', })
    // @ApiResponse({ status: 200, description: 'Chat permanently deleted successfully', type: BaseResponseDto<null>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async permanentRemove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    //     await this.chatService.permanentRemove(id);
    //     return new BaseResponseDto(null, 'Chat permanently deleted successfully');
    // }

    // @Post(':id/restore')
    // @ApiOperation({ summary: 'Restore a soft-deleted chat', description: 'Restores a soft-deleted chat.', })
    // @ApiParam({ name: 'id', description: 'Chat ID (uuid)', example: 1, type: 'number', })
    // @ApiResponse({ status: 200, description: 'Chat restored successfully', type: BaseResponseDto<null>, })
    // @ApiResponse({ status: 404, description: 'Chat not found', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    //     await this.chatService.restore(id);
    //     return new BaseResponseDto(null, 'Chat restored successfully');
    // }
}


