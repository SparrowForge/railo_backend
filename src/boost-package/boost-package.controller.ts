import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { BoostPackageService } from './boost-package.service';
import { CreateBoostPackageDto } from './dto/create-boost-package.dto';
import { FilterBoostPackageDto } from './dto/filter-boost-package.dto';
import { UpdateBoostPackageDto } from './dto/update-boost-package.dto';

@ApiTags('Boost Package')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/boost-package')
export class BoostPackageController {
  constructor(private readonly boostPackageService: BoostPackageService) { }

  @Get()
  @ApiOperation({ summary: 'Get all boost packages with pagination and filters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterBoostPackageDto) {
    const { page, limit, ...boostPackageFilters } = filters;
    const pagination = { page, limit };
    const boostPackages = await this.boostPackageService.findAll(
      pagination,
      boostPackageFilters,
    );

    return new BaseResponseDto(boostPackages, 'Boost packages retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get boost package by id' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const boostPackage = await this.boostPackageService.findOne(id);
    return new BaseResponseDto(boostPackage, 'Boost package retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create boost package' })
  @ApiResponse({ status: 201, description: 'Boost package saved successfully', type: BaseResponseDto })
  async create(@Body() dto: CreateBoostPackageDto) {
    const result = await this.boostPackageService.create(dto);
    return new BaseResponseDto(result, 'Boost package saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update boost package' })
  @ApiResponse({ status: 200, description: 'Boost package updated successfully', type: BaseResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBoostPackageDto,
  ) {
    const result = await this.boostPackageService.update(id, dto);
    return new BaseResponseDto(result, 'Boost package updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete boost package' })
  @ApiResponse({ status: 200, description: 'Boost package deleted successfully', type: BaseResponseDto })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.boostPackageService.remove(id);
    return new BaseResponseDto(result, 'Boost package deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete boost package' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.boostPackageService.permanentRemove(id);
    return new BaseResponseDto(result, 'Boost package deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore boost package' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.boostPackageService.restore(id);
    return new BaseResponseDto(result, 'Boost package restored successfully');
  }
}
