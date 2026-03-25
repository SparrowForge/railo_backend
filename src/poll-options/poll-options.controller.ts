import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { PollOptionsService } from './poll-options.service';
import { FilterPollOptionsDto } from './dto/filter-poll-options.dto';
import { CreatePollOptionsDto } from './dto/create-poll-options.dto';
import { UpdatePollOptionsDto } from './dto/update-poll-options.dto';

@ApiTags('PollOptions')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/poll-options')
export class PollOptionsController {
    constructor(
        private readonly polloptionsService: PollOptionsService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all with pagination and filters', description: 'Retrieves a paginated list of all active with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getIncomingRequests(@Query() filters: FilterPollOptionsDto) {
        const { page, limit, ...polloptionssFilters } = filters;
        const pagination = { page, limit };
        const polloptionss = await this.polloptionsService.findAll(pagination, polloptionssFilters);
        return new BaseResponseDto(polloptionss, 'PollOptionss retrieved successfully');
    }


    @Get(':id')
    @ApiOperation({ summary: 'Get all with pagination and filters', description: 'Retrieves a paginated list of all active with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getOutgoingRequests(@Param('id', new ParseUUIDPipe()) id: string) {
        const polloptionss = await this.polloptionsService.findOne(id);
        return new BaseResponseDto(polloptionss, 'PollOptionss retrieved successfully');
    }

    @Post()
    @ApiOperation({ summary: 'save polloptions' })
    @ApiResponse({ status: 201, description: 'PollOptions save successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'PollOptions already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async sendChatRequest(@CurrentUser() user: AuthUser, @Body() dto: CreatePollOptionsDto,) {
        dto.created_by_user_id = user.userId;
        const result = await this.polloptionsService.create(dto);
        return new BaseResponseDto(result, 'PollOptions saved successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'update polloptions' })
    @ApiResponse({ status: 201, description: 'PollOptions update successfully', type: BaseResponseDto, })
    @ApiResponse({ status: 400, description: 'PollOptions already exists', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async acceptChatRequest(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePollOptionsDto,) {
        const result = await this.polloptionsService.update(id, dto);
        return new BaseResponseDto(result, `PollOptions updated successfully`);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'delete polloptions' })
    @ApiResponse({ status: 200, description: 'PollOptions delete successfully', type: BaseResponseDto, })
    async deletePollOptions(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.polloptionsService.remove(id);
        return new BaseResponseDto(result, `PollOptions deleted successfully`);
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'delete polloptions permanently' })
    async deletePollOptionsPermanently(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.polloptionsService.permanentRemove(id);
        return new BaseResponseDto(result, `PollOptions deleted permanently`);
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'restore polloptions' })
    async restorePollOptions(@Param('id', new ParseUUIDPipe()) id: string) {
        const result = await this.polloptionsService.restore(id);
        return new BaseResponseDto(result, `PollOptions restored successfully`);
    }
}

