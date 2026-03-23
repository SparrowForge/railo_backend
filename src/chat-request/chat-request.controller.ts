import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChatRequestService } from './chat-request.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateChatRequestDto } from './dto/create-chat-request.dto';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { UpdateChatRequestStatusDto } from './dto/update-chat-request.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilterChatDto } from './dto/filter-chat-request.dto';

@ApiTags('Chat Request')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/chat-request')

export class ChatRequestController {
    constructor(
        private readonly chatRequestService: ChatRequestService,
    ) { }

    @Get('get-incoming-requests')
    @ApiOperation({ summary: 'Get all words with pagination and filters', description: 'Retrieves a paginated list of all active words with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getIncomingRequests(@Query() filters: FilterChatDto) {
        const { page, limit, ...wordsFilters } = filters;
        const pagination = { page, limit };
        const words = await this.chatRequestService.get_incoming_requests(pagination, wordsFilters);
        return new BaseResponseDto(words, 'Chats retrieved successfully');
    }


    @Get('get-outgoing-requests')
    @ApiOperation({ summary: 'Get all words with pagination and filters', description: 'Retrieves a paginated list of all active words with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getOutgoingRequests(@Query() filters: FilterChatDto) {
        const { page, limit, ...wordsFilters } = filters;
        const pagination = { page, limit };
        const words = await this.chatRequestService.get_outgoing_requests(pagination, wordsFilters);
        return new BaseResponseDto(words, 'Chats retrieved successfully');
    }


    @Post('send-chat-request')
    @ApiOperation({ summary: 'send chat request' })
    @ApiResponse({ status: 201, description: 'Chat request send successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'Chat request already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async sendChatRequest(@CurrentUser() user: AuthUser, @Body() dto: CreateChatRequestDto,) {
        const result = await this.chatRequestService.send_request(
            user.userId,
            dto.receiver_id,
            dto.message,
        );
        return new BaseResponseDto(result, 'Chat request send successfully');
    }

    @Post('accept-chat-request')
    @ApiOperation({ summary: 'send chat request' })
    @ApiResponse({ status: 201, description: 'Chat request send successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'Chat request already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async acceptChatRequest(@CurrentUser() user: AuthUser, @Body() dto: UpdateChatRequestStatusDto,) {
        const result = await this.chatRequestService.requestAcceptOrReject(user.userId, dto);
        return new BaseResponseDto(result, `Chat request ${dto.status} successfully`);
    }
}
