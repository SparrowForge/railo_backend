import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoryService } from './story.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateStoryDto } from './dto/create-story.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Story } from './entities/story.entity';


@ApiTags('Story')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/stories')
export class StoryController {
    constructor(private readonly storyService: StoryService) { }

    @Post()
    @ApiOperation({
        summary: 'Create story entries',
        description: 'Creates up to 3 stories for the authenticated user from provided file IDs. Requires authentication.',
    })
    @ApiResponse({ status: 201, description: 'Stories created successfully', type: BaseResponseDto<Story[]>, })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async createStory(@CurrentUser() user: AuthUser, @Body() dto: CreateStoryDto) {
        const stories = await this.storyService.createStory(user.userId, dto);
        return new BaseResponseDto(stories, 'Stories created successfully');
    }

    @Get()
    @ApiOperation({
        summary: 'Get active stories feed',
        description: 'Retrieves active stories for the feed with pagination. Requires authentication.',
    })
    @ApiResponse({ status: 200, description: 'Active stories retrieved successfully', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getActiveStories(
        @CurrentUser() user: AuthUser,
        @Query() paginationDto: PaginationDto,
    ) {
        const { page, limit } = paginationDto;
        const pagination = { page, limit };
        const stories = await this.storyService.getActiveStories(user.userId, pagination);
        return new BaseResponseDto(stories, 'Active stories retrieved successfully');
    }

    @Get('me')
    @ApiOperation({
        summary: 'Get my active stories',
        description: 'Retrieves active stories created by the authenticated user. Requires authentication.',
    })
    @ApiResponse({ status: 200, description: 'My stories retrieved successfully', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getMyStories(@CurrentUser() user: AuthUser, @Query() paginationDto: PaginationDto) {
        const { page, limit } = paginationDto;
        const pagination = { page, limit };
        const stories = await this.storyService.getUserStories(user.userId, pagination);
        return new BaseResponseDto(stories, 'My stories retrieved successfully');
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'Mark story as viewed', description: 'Marks a story as viewed by the authenticated user.', })
    @ApiParam({ name: 'id', description: 'Story ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Story viewed successfully', })
    @ApiResponse({ status: 404, description: 'Story not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async viewStory(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) storyId: string,
    ) {
        const storyStats = await this.storyService.viewStory(storyId, user.userId);
        return new BaseResponseDto(storyStats, 'Story viewed successfully');
    }

    @Post(':id/toggle-like')
    @ApiOperation({ summary: 'Toggle like a story', description: 'Likes or unlikes a story for the authenticated user.', })
    @ApiParam({ name: 'id', description: 'Story ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Story like toggled successfully', })
    @ApiResponse({ status: 404, description: 'Story not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async toggleLikeStory(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) storyId: string,
    ) {
        const likeStatus = await this.storyService.toggleLike(storyId, user.userId);
        return new BaseResponseDto(likeStatus, 'Story like toggled successfully');
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete own story', description: 'Deletes an active story owned by the authenticated user.', })
    @ApiParam({ name: 'id', description: 'Story ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Story deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Story not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async deleteStory(
        @CurrentUser() user: AuthUser,
        @Param('id', ParseUUIDPipe) storyId: string,
    ) {
        await this.storyService.deleteStory(storyId, user.userId);
        return new BaseResponseDto(null, 'Story deleted successfully');
    }
}
