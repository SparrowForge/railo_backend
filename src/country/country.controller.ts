import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { CountryService } from './country.service';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@ApiTags('Country')
@ApiBearerAuth()
@Controller('api/v1/country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a country' })
  @ApiResponse({
    status: 201,
    description: 'Country created successfully',
    type: BaseResponseDto<Country>,
  })
  async create(@Body() createCountryDto: CreateCountryDto) {
    const country = await this.countryService.create(createCountryDto);
    return new BaseResponseDto(country, 'Country created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all countries' })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
    type: BaseResponseDto<Country>,
  })
  async findAll() {
    const countries = await this.countryService.findAll();
    return new BaseResponseDto(countries, 'Countries retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a country by id' })
  @ApiParam({
    name: 'id',
    description: 'Country ID (uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Country retrieved successfully',
    type: BaseResponseDto<Country>,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const country = await this.countryService.findOne(id);
    return new BaseResponseDto(country, 'Country retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a country by id' })
  @ApiParam({
    name: 'id',
    description: 'Country ID (uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Country updated successfully',
    type: BaseResponseDto<Country>,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCountryDto: UpdateCountryDto,
  ) {
    const country = await this.countryService.update(id, updateCountryDto);
    return new BaseResponseDto(country, 'Country updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a country by id' })
  @ApiParam({
    name: 'id',
    description: 'Country ID (uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Country deleted successfully',
    type: BaseResponseDto<null>,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.countryService.remove(id);
    return new BaseResponseDto(null, 'Country deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Delete a country permanently' })
  @ApiParam({
    name: 'id',
    description: 'Country ID (uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Country permanently deleted successfully',
    type: BaseResponseDto<null>,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.countryService.permanentRemove(id);
    return new BaseResponseDto(
      null,
      'Country permanently deleted successfully',
    );
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted country' })
  @ApiParam({
    name: 'id',
    description: 'Country ID (uuid)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Country restored successfully',
    type: BaseResponseDto<null>,
  })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.countryService.restore(id);
    return new BaseResponseDto(null, 'Country restored successfully');
  }
}
