import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CurrentUser } from './../common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new user', description: 'Creates a new user with the provided information. Password will be hashed before saving. Requires authentication.',
  })
  @ApiResponse({ status: 201, description: 'User created successfully', type: BaseResponseDto<User>, })
  @ApiResponse({ status: 400, description: 'Bad request - validation error', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async create(@CurrentUser() authUser: AuthUser, @Body() createUserDto: CreateUserDto) {
    createUserDto.created_by = authUser.userId;
    console.log(createUserDto);
    const user = await this.usersService.create(createUserDto);
    return new BaseResponseDto(user, 'User created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination and filters', description: 'Retrieves a paginated list of all active users with optional filtering by role, department, and search terms. Requires authentication.', })
  @ApiResponse({
    status: 200, description: 'Returns paginated list of users', type: BaseResponseDto<PaginatedResponseDto<User>>,
    schema: {
      example: {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          items: [
            {
              id: 1,
              email: 'admin@blueatlantic.com',
              firstName: 'Super',
              lastName: 'User',
              status: 'active',
              phone: '+1234567890',
              createdAt: '2024-03-14T12:00:00.000Z',
              updatedAt: '2024-03-14T12:00:00.000Z',
              deletedAt: null,
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
        timestamp: '2024-03-14T12:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async findAll(@Query() filters: FilterUserDto) {
    const { page, limit, ...userFilters } = filters;
    const pagination = { page, limit };
    const users = await this.usersService.findAll(pagination, userFilters);
    return new BaseResponseDto(users, 'Users retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id', description: 'Retrieves a specific user by their ID. Only returns active users (soft-deleted users are excluded). Requires authentication.', })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'string', })
  @ApiResponse({ status: 200, description: 'User retrieved successfully', type: BaseResponseDto<User>, })
  @ApiResponse({ status: 404, description: 'User not found', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return new BaseResponseDto(user, 'User retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by id', description: 'Updates an existing user with the provided information. Only active users can be updated. Requires authentication.', })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'number', })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: BaseResponseDto<User>, })
  @ApiResponse({ status: 404, description: 'User not found', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async update(@CurrentUser() authUser: AuthUser, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto,) {
    updateUserDto.updated_by = authUser.userId;
    console.log(updateUserDto);
    const user = await this.usersService.update(id, updateUserDto);
    return new BaseResponseDto(user, 'User updated successfully');
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete a user by id',
    description: 'Soft deletes a user by setting the deletedAt timestamp. The user will not appear in regular queries but can be restored. Requires authentication.',
  })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', example: 1, type: 'number', })
  @ApiResponse({ status: 200, description: 'User soft deleted successfully', type: BaseResponseDto<null>, })
  @ApiResponse({ status: 404, description: 'User not found', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return new BaseResponseDto(null, 'User soft deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a user by id', description: 'Permanently deletes a user from the database. This action cannot be undone. Requires authentication.', })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', example: 1, type: 'number', })
  @ApiResponse({ status: 200, description: 'User permanently deleted successfully', type: BaseResponseDto<null>, })
  @ApiResponse({ status: 404, description: 'User not found', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async permanentRemove(@Param('id') id: string) {
    await this.usersService.permanentRemove(id);
    return new BaseResponseDto(null, 'User permanently deleted successfully');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user', description: 'Restores a soft-deleted user.', })
  @ApiParam({ name: 'id', description: 'User ID (uuid)', example: 1, type: 'number', })
  @ApiResponse({ status: 200, description: 'User restored successfully', type: BaseResponseDto<null>, })
  @ApiResponse({ status: 404, description: 'User not found', })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
  async restore(@Param('id') id: string) {
    await this.usersService.restore(id);
    return new BaseResponseDto(null, 'User restored successfully');
  }
}
