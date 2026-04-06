import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateSubscriptionPackageDto } from './dto/create-subscription-package.dto';
import { FilterSubscriptionPackageDto } from './dto/filter-subscription-package.dto';
import { UpdateSubscriptionPackageDto } from './dto/update-subscription-package.dto';
import { SubscriptionPackageService } from './subscription-package.service';

@ApiTags('Subscription Package')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/subscription-package')
export class SubscriptionPackageController {
  constructor(private readonly subscriptionPackageService: SubscriptionPackageService) { }

  @Get()
  @ApiOperation({ summary: 'Get all subscription packages with pagination and filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterSubscriptionPackageDto) {
    const { page, limit, ...subscriptionPackageFilters } = filters;
    const pagination = { page, limit };
    console.log(subscriptionPackageFilters)
    const subscriptionPackages = await this.subscriptionPackageService.findAll(
      pagination,
      subscriptionPackageFilters,
    );

    return new BaseResponseDto(subscriptionPackages, 'Subscription packages retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription package by id' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const subscriptionPackage = await this.subscriptionPackageService.findOne(id);
    return new BaseResponseDto(subscriptionPackage, 'Subscription package retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription package' })
  @ApiResponse({ status: 201, description: 'Subscription package saved successfully', type: BaseResponseDto })
  async create(@Body() dto: CreateSubscriptionPackageDto) {
    const result = await this.subscriptionPackageService.create(dto);
    return new BaseResponseDto(result, 'Subscription package saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription package' })
  @ApiResponse({ status: 200, description: 'Subscription package updated successfully', type: BaseResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubscriptionPackageDto,
  ) {
    const result = await this.subscriptionPackageService.update(id, dto);
    return new BaseResponseDto(result, 'Subscription package updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete subscription package' })
  @ApiResponse({ status: 200, description: 'Subscription package deleted successfully', type: BaseResponseDto })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.subscriptionPackageService.remove(id);
    return new BaseResponseDto(result, 'Subscription package deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete subscription package' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.subscriptionPackageService.permanentRemove(id);
    return new BaseResponseDto(result, 'Subscription package deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore subscription package' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.subscriptionPackageService.restore(id);
    return new BaseResponseDto(result, 'Subscription package restored successfully');
  }
}
