import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async create(createCountryDto: CreateCountryDto) {
    const country = this.countryRepository.create(createCountryDto);
    return this.countryRepository.save(country);
  }

  async findAll(): Promise<Country[]> {
    return this.countryRepository.find({
      order: {
        country_name: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Country> {
    const country = await this.countryRepository.findOne({
      where: { id },
      withDeleted: false,
    });

    if (!country) {
      throw new NotFoundException(`Country with id ${id} not found`);
    }

    return country;
  }

  async update(id: string, updateCountryDto: UpdateCountryDto) {
    const country = await this.findOne(id);
    Object.assign(country, updateCountryDto);
    return this.countryRepository.save(country);
  }

  async remove(id: string) {
    const country = await this.findOne(id);
    return this.countryRepository.softDelete(country.id);
  }

  permanentRemove(id: string) {
    return this.countryRepository.delete(id);
  }

  restore(id: string) {
    return this.countryRepository.restore(id);
  }
}
