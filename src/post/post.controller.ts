/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PostService } from './post.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterPostDto } from './dto/filter-post.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { CreatePostDto } from './dto/create-post.dto';
import { Posts } from './entities/post.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreatePostReportDto } from './dto/create-post-report.dto';
import { VotePostPollDto } from './dto/vote-post-poll.dto';

@ApiTags('Post')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/post')
export class PostController {
    constructor(private readonly postService: PostService) { }

    @Get('get-global-feed')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostList(@CurrentUser() user: AuthUser, @Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getGlobalFeed(user.userId, pagination, filters);
        return new BaseResponseDto(post, 'Global feed retrieved successfully');
    }

    @Get('get-user-profile-feed')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getUserProfileFeed(@CurrentUser() user: AuthUser, @Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getUserProfileFeed(
            pagination,
            user.userId,
            (filters.userId ?? ''),
            filters.userInteractionType,
            filters);
        return new BaseResponseDto(post, 'User profile feed list retrieved successfully');
    }

    @Get('get-user-feed')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getUserFeed(@Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getUserFeed(pagination, filters.userId ?? '');
        return new BaseResponseDto(post, 'User feed list retrieved successfully');
    }

    @Get('get-post/:id')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostById(@CurrentUser() user: AuthUser, @Param('id') id: string,): Promise<BaseResponseDto<any>> {
        const post = await this.postService.getPostById(id);
        return new BaseResponseDto(post, 'Post retrieved successfully');
    }

    @Get('get-post/:id/analytics')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostAnalytics(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Query('days') days = '30',
    ): Promise<BaseResponseDto<any>> {
        const post = await this.postService.getPostViewAnalytics(id, Number(days));
        return new BaseResponseDto(post, 'Post retrieved successfully');
    }


    @Post()
    @ApiOperation({
        summary: 'Create a new post', description: 'Creates a new post with the provided information. Password will be hashed before saving. Requires authentication.',
    })
    @ApiResponse({ status: 201, description: 'Post created successfully', type: BaseResponseDto<Posts>, })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async create(@CurrentUser() user: AuthUser, @Body() createPostDto: CreatePostDto) {
        const post = await this.postService.createPost(user.userId, createPostDto);
        return new BaseResponseDto(post, 'Post created successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a post by id', description: 'Updates an existing post with the provided information. Only active post can be updated. Requires authentication.', })
    @ApiResponse({ status: 200, description: 'Post updated successfully', type: BaseResponseDto<Posts>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() updatePostDto: UpdatePostDto,) {
        const post = await this.postService.updatePost(id, user.userId, updatePostDto);
        return new BaseResponseDto(post, 'Post updated successfully');
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Soft delete a post by id',
        description: 'Soft deletes a post by setting the deletedAt timestamp. The post will not appear in regular queries but can be restored. Requires authentication.',
    })
    @ApiParam({ name: 'id', description: 'Post ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Post soft deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.postService.softDelete(id, user.userId);
        return new BaseResponseDto(null, 'Post soft deleted successfully');
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'Restore a soft-deleted post', description: 'Restores a soft-deleted post.', })
    @ApiParam({ name: 'id', description: 'Post ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Post restored successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.postService.restore(id, user.userId);
        return new BaseResponseDto(null, 'Post restored successfully');
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'Permanently delete a post by id', description: 'Permanently deletes a post from the database. This action cannot be undone. Requires authentication.', })
    @ApiParam({ name: 'id', description: 'Post ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Post permanently deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async permanentRemove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.postService.permanentDelete(id, user.userId);
        return new BaseResponseDto(null, 'Post permanently deleted successfully');
    }

    @Post(':id/toggle-like')
    @ApiOperation({ summary: 'Toggle like a post', })
    @ApiResponse({ status: 200, description: 'Post like toogled successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async toggleLike(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.toggleLike(id, user.userId);
        return new BaseResponseDto(res, 'Post like toogled successfully');
    }

    @Post(':id/toggle-pin')
    @ApiOperation({ summary: 'Toggle pin a post', })
    @ApiResponse({ status: 200, description: 'Post pin toggled successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async togglePin(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.togglePin(id, user.userId);
        return new BaseResponseDto(res, 'Post pin toggled successfully');
    }

    @Post(':id/enable-notification')
    @ApiOperation({ summary: 'Enable notifications for a post' })
    @ApiResponse({ status: 200, description: 'Post notification enabled successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async enablePostNotification(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.enablePostNotification(id, user.userId);
        return new BaseResponseDto(res, 'Post notification enabled successfully');
    }

    @Post(':id/disable-notification')
    @ApiOperation({ summary: 'Disable notifications for a post' })
    @ApiResponse({ status: 200, description: 'Post notification disabled successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async disablePostNotification(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.disablePostNotification(id, user.userId);
        return new BaseResponseDto(res, 'Post notification disabled successfully');
    }

    @Post(':id/vote')
    @ApiOperation({ summary: 'Vote on a poll post' })
    @ApiResponse({ status: 200, description: 'Poll voted successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post or poll option not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async votePoll(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: VotePostPollDto,
    ) {
        const res = await this.postService.votePoll(id, dto.pollOptionId, user.userId);
        return new BaseResponseDto(res, 'Poll voted successfully');
    }

    @Delete(':id/vote')
    @ApiOperation({ summary: 'Undo vote on a poll post' })
    @ApiResponse({ status: 200, description: 'Poll vote removed successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post or vote not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async undoVotePoll(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.undoVotePoll(id, user.userId);
        return new BaseResponseDto(res, 'Poll vote removed successfully');
    }

    @Get('get-pinned-posts')
    @ApiOperation({ summary: 'Get pinned posts for the current user', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPinnedPosts(@CurrentUser() user: AuthUser, @Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getPinnedPosts(user.userId, pagination);
        return new BaseResponseDto(post, 'Pinned post list retrieved successfully');
    }

    @Post(':id/view')
    @ApiOperation({ summary: 'View a post', })
    @ApiResponse({ status: 200, description: 'Post viewed successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async postView(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.postView(id, user.userId);
        return new BaseResponseDto(res, 'Post viewed successfully');
    }

    @Post(':id/share-post')
    @ApiOperation({ summary: 'Share a post', description: 'Share a post' })
    @ApiResponse({ status: 200, description: 'Post shared successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async sharePost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.postService.sharePost(id, user.userId);
        return new BaseResponseDto(null, 'Post shared successfully');
    }

    @Post(':id/report')
    @ApiOperation({ summary: 'Report a post', description: 'Report a post with one or more predefined criteria.' })
    @ApiResponse({ status: 200, description: 'Post reported successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async reportPost(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() createPostReportDto: CreatePostReportDto) {
        const res = await this.postService.reportPost(id, user.userId, createPostReportDto);
        return new BaseResponseDto(res, 'Post reported successfully');
    }

    @Delete(':reportId/report/delete')
    @ApiOperation({ summary: 'Report a post', description: 'Report a post with one or more predefined criteria.' })
    @ApiResponse({ status: 200, description: 'Post reported successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async reportDelete(@CurrentUser() user: AuthUser, @Param('reportId') reportId: string) {
        const res = await this.postService.reportDelete(reportId);
        return new BaseResponseDto(res, 'Report deleted successfully');
    }

    @Post(':id/hide')
    @ApiOperation({ summary: 'Hide a post', description: 'Hide a post.' })
    @ApiResponse({ status: 200, description: 'Post Hide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async hidePost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.hidePost(id, user.userId);
        return new BaseResponseDto(res, 'Post hide successfully');
    }

    @Post(':id/unhide')
    @ApiOperation({ summary: 'Unhide a post', description: 'Unhide a post .' })
    @ApiResponse({ status: 200, description: 'Post Unhide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async unhidePost(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        const res = await this.postService.unhidePost(id, user.userId);
        return new BaseResponseDto(res, 'Post unhide successfully');
    }

    @Post(':targetUserId/user-hide')
    @ApiOperation({ summary: 'userHide', description: 'userHide' })
    @ApiResponse({ status: 200, description: 'userHide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async userHide(@CurrentUser() user: AuthUser, @Param('targetUserId') targetUserId: string) {
        const res = await this.postService.userHide(targetUserId, user.userId);
        return new BaseResponseDto(res, 'User hide successfully');
    }

    @Post(':targetUserId/user-unhide')
    @ApiOperation({ summary: 'userUnHide', description: 'userUnHide' })
    @ApiResponse({ status: 200, description: 'userUnHide successfully', type: BaseResponseDto<any>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async userUnHide(@CurrentUser() user: AuthUser, @Param('targetUserId') targetUserId: string) {
        const res = await this.postService.userUnHide(targetUserId, user.userId);
        return new BaseResponseDto(res, 'User unhide successfully');
    }


}


