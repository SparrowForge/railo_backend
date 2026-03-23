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

    @Get('get-user-feed')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getUserFeed(@Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getUserFeed(pagination, filters.userId ?? '');
        return new BaseResponseDto(post, 'User feed list retrieved successfully');
    }

    @Get('get-user-profile-feed')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getUserProfileFeed(@CurrentUser() user: AuthUser, @Query() filters: FilterPostDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.postService.getUserProfileFeed(pagination, (filters.userId ?? ''), user.userId, filters.userInteractionType);
        return new BaseResponseDto(post, 'User profile feed list retrieved successfully');
    }

    @Get('get-post-by-id/:id')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostById(@CurrentUser() user: AuthUser, @Param('id') id: string,): Promise<BaseResponseDto<any>> {
        const post = await this.postService.getPostById(user.userId, id);
        return new BaseResponseDto(post, 'Post retrieved successfully');
    }

    @Get('get-post-by-id/:id/dashboard')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostByIdDashboard(@CurrentUser() user: AuthUser, @Param('id') id: string,): Promise<BaseResponseDto<any>> {
        const post = await this.postService.getPostById(user.userId, id);
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
        await this.postService.toggleLike(id, user.userId);
        return new BaseResponseDto(null, 'Post like toogled successfully');
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

    // @Get('get-messages')
    // @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async getMessages(@Query() filters: FilterMessageDto) {
    //     const { page, limit, ...postFilters } = filters;
    //     const pagination = { page, limit };
    //     const post = await this.postService.get_messages(pagination, postFilters);
    //     return new BaseResponseDto(post, 'Post list retrieved successfully');
    // }

    // @Post('mark-as-read')
    // @ApiOperation({ summary: 'Read all post', description: 'Read all post', })
    // @ApiResponse({ status: 201, description: 'Read all post successfully' })
    // @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async markAsRead(@CurrentUser() user: AuthUser, @Body() readAllPost: ReadAllPostRequestDto) {
    //     await this.postService.markConversationAsRead(readAllPost.conversationId, user.userId);
    //     await this.postService.markMessagesAsRead(readAllPost.conversationId, user.userId);
    //     return new BaseResponseDto('All message mark as read successfully in this conversation');
    // }

    // @Get()
    // @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    // @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    // async findAll(@Query() filters: FilterPostDto) {
    //     const { page, limit, ...postFilters } = filters;
    //     const pagination = { page, limit };
    //     const post = await this.postService.findAll(pagination, postFilters);
    //     return new BaseResponseDto(post, 'Post retrieved successfully');
    // }



}


