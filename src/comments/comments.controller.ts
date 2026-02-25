import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CommentService } from './comments.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { CommentDto } from './dto/comment.dto';
import { Comments } from './entities/comment.entity';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterCommentDto } from './dto/filter-comments.dto';
import { UpdateCommentsDto } from './dto/UpdateComments.Dto';
import { ReplyCommentDto } from './dto/reply-comment.dto';
import { FilterCommentRepliyDto } from './dto/filter-comments-replies.dto';

@ApiTags('Post Comments')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/comments')
export class CommentsController {
    constructor(private readonly commentService: CommentService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new post', description: 'Creates a new post with the provided information. Password will be hashed before saving. Requires authentication.',
    })
    @ApiResponse({ status: 201, description: 'Post created successfully', type: BaseResponseDto<Comments>, })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async save(@CurrentUser() user: AuthUser, @Body() createPostDto: CommentDto) {
        const post = await this.commentService.addComment(user.userId, createPostDto);
        return new BaseResponseDto(post, 'Post created successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a post by id', description: 'Updates an existing post with the provided information. Only active post can be updated. Requires authentication.', })
    @ApiResponse({ status: 200, description: 'Post updated successfully', type: BaseResponseDto<Comments>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() updatePostDto: UpdateCommentsDto,) {
        const post = await this.commentService.update(id, updatePostDto.text);
        return new BaseResponseDto(post, 'Post updated successfully');
    }

    @Get('get-post-comments')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getPostList(@Query() filters: FilterCommentDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.commentService.getPostComments(pagination, filters.postId);
        return new BaseResponseDto(post, 'Post root comments retrieved successfully');
    }

    @Get('get-comments-by-id/:id')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getCommentsById(@Param('id') id: string,) {
        const post = await this.commentService.getCommentsById(id);
        return new BaseResponseDto(post, 'Post root comments retrieved successfully');
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
        await this.commentService.softDelete(id);
        return new BaseResponseDto(null, 'Post soft deleted successfully');
    }

    @Post(':id/restore')
    @ApiOperation({ summary: 'Restore a soft-deleted post', description: 'Restores a soft-deleted post.', })
    @ApiParam({ name: 'id', description: 'Post ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Post restored successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.commentService.restore(id);
        return new BaseResponseDto(null, 'Post restored successfully');
    }

    @Delete(':id/permanent')
    @ApiOperation({ summary: 'Permanently delete a post by id', description: 'Permanently deletes a post from the database. This action cannot be undone. Requires authentication.', })
    @ApiParam({ name: 'id', description: 'Post ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'Post permanently deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async permanentRemove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.commentService.permanentDelete(id);
        return new BaseResponseDto(null, 'Post permanently deleted successfully');
    }

    @Post(':id/toggle-like')
    @ApiOperation({ summary: 'Toggle like a post', })
    @ApiResponse({ status: 200, description: 'Post like toogled successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'Post not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async toggleLike(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.commentService.toggleCommentLike(id, user.userId);
        return new BaseResponseDto(null, 'Post like toogled successfully');
    }


    @Post('reply-to-comments')
    @ApiOperation({
        summary: 'Create a new post', description: 'Creates a new post with the provided information. Password will be hashed before saving. Requires authentication.',
    })
    @ApiResponse({ status: 201, description: 'Post created successfully', type: BaseResponseDto<Comments>, })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async replyToComment(@CurrentUser() user: AuthUser, @Body() replyCommentDto: ReplyCommentDto) {
        const post = await this.commentService.replyToComment(user.userId, replyCommentDto);
        return new BaseResponseDto(post, 'Post created successfully');
    }

    @Get('get-comments-replies')
    @ApiOperation({ summary: 'Get all post with pagination and filters', description: 'Retrieves a paginated list of all active post with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async getCommentReplies(@Query() filters: FilterCommentRepliyDto) {
        const { page, limit } = filters;
        const pagination = { page, limit };
        const post = await this.commentService.getCommentReplies(pagination, filters.parentCommentId);
        return new BaseResponseDto(post, 'Post root comments retrieved successfully');
    }




}



