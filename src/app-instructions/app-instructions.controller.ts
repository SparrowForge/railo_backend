import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AppInstructionsService } from './app-instructions.service';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type AuthUser from 'src/auth/dto/auth-user';
import { CreateAppInstructionDto } from './dto/create-app-instructions.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { AppInstructions } from './entities/app-instructions.entity';
import { UpdateAppInstructionDto } from './dto/update-app-instructions.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';

@ApiTags('App Instructions')
@ApiBearerAuth()
@Controller('api/v1/app-instructions')
export class AppInstructionsController {
    constructor(private readonly appinstructionsService: AppInstructionsService) { }

    @Post()
    @ApiOperation({
        summary: 'Create a new appinstructions', description: 'Creates a new appinstructions with the provided information. Password will be hashed before saving. Requires authentication.',
    })
    @ApiResponse({ status: 201, description: 'AppInstructions created successfully', type: BaseResponseDto<AppInstructions>, })
    @ApiResponse({ status: 400, description: 'Bad request - validation error', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async create(@CurrentUser() user: AuthUser, @Body() createAppInstructionsDto: CreateAppInstructionDto) {
        console.log('user:', user)
        createAppInstructionsDto.created_by_id = user.userId;
        const appinstructions = await this.appinstructionsService.create(createAppInstructionsDto);
        return new BaseResponseDto(appinstructions, 'AppInstructions created successfully');
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all appinstructions with pagination and filters', description: 'Retrieves a paginated list of all active appinstructions with optional filtering by role, department, and search terms. Requires authentication.', })
    @ApiResponse({
        status: 200, description: 'Returns paginated list of appinstructions', type: BaseResponseDto<AppInstructions>,
        schema: {
            example: {
                success: true,
                message: 'AppInstructions retrieved successfully',
                data: {
                    items: [] as AppInstructions[],
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
    async findAll() {
        const appinstructions = await this.appinstructionsService.findAll();
        return new BaseResponseDto(appinstructions, 'AppInstructions retrieved successfully');
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get a appinstructions by id', description: 'Retrieves a specific appinstructions by their ID. Only returns active appinstructions (soft-deleted appinstructions are excluded). Requires authentication.', })
    @ApiParam({ name: 'id', description: 'AppInstructions ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'string', })
    @ApiResponse({ status: 200, description: 'AppInstructions retrieved successfully', type: BaseResponseDto<AppInstructions>, })
    @ApiResponse({ status: 404, description: 'AppInstructions not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async findOne(@Param('id') id: string) {
        const appinstructions = await this.appinstructionsService.findOne(id);
        return new BaseResponseDto(appinstructions, 'AppInstructions retrieved successfully');
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a appinstructions by id', description: 'Updates an existing appinstructions with the provided information. Only active appinstructions can be updated. Requires authentication.', })
    @ApiParam({ name: 'id', description: 'AppInstructions ID (uuid)', example: '45e16f14-b27f-4d20-99df-c1d5535ff9e3', type: 'number', })
    @ApiResponse({ status: 200, description: 'AppInstructions updated successfully', type: BaseResponseDto<AppInstructions>, })
    @ApiResponse({ status: 404, description: 'AppInstructions not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() updateAppInstructionsDto: UpdateAppInstructionDto,) {
        const appinstructions = await this.appinstructionsService.update(id, updateAppInstructionsDto);
        return new BaseResponseDto(appinstructions, 'AppInstructions updated successfully');
    }

    @Delete(':id')
    @Roles(RolesEnum.admin)
    @ApiOperation({
        summary: 'Soft delete a appinstructions by id',
        description: 'Soft deletes a appinstructions by setting the deletedAt timestamp. The appinstructions will not appear in regular queries but can be restored. Requires authentication.',
    })
    @ApiParam({ name: 'id', description: 'AppInstructions ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'AppInstructions soft deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'AppInstructions not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.appinstructionsService.remove(id);
        return new BaseResponseDto(null, 'AppInstructions soft deleted successfully');
    }

    @Delete(':id/permanent')
    @Roles(RolesEnum.admin)
    @ApiOperation({ summary: 'Permanently delete a appinstructions by id', description: 'Permanently deletes a appinstructions from the database. This action cannot be undone. Requires authentication.', })
    @ApiParam({ name: 'id', description: 'AppInstructions ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'AppInstructions permanently deleted successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'AppInstructions not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async permanentRemove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.appinstructionsService.permanentRemove(id);
        return new BaseResponseDto(null, 'AppInstructions permanently deleted successfully');
    }

    @Post(':id/restore')
    @Roles(RolesEnum.admin)
    @ApiOperation({ summary: 'Restore a soft-deleted appinstructions', description: 'Restores a soft-deleted appinstructions.', })
    @ApiParam({ name: 'id', description: 'AppInstructions ID (uuid)', example: 1, type: 'number', })
    @ApiResponse({ status: 200, description: 'AppInstructions restored successfully', type: BaseResponseDto<null>, })
    @ApiResponse({ status: 404, description: 'AppInstructions not found', })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required', })
    async restore(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        await this.appinstructionsService.restore(id);
        return new BaseResponseDto(null, 'AppInstructions restored successfully');
    }
}



