import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppInstructions } from './entities/app-instructions.entity';
import { Repository } from 'typeorm';
import { CreateAppInstructionDto } from './dto/create-app-instructions.dto';
import { UpdateAppInstructionDto } from './dto/update-app-instructions.dto';

@Injectable()
export class AppInstructionsService {

    constructor(
        @InjectRepository(AppInstructions)
        private AppInstructionRepository: Repository<AppInstructions>,
    ) { }

    async create(dto: CreateAppInstructionDto) {

        const AppInstruction = this.AppInstructionRepository.create(dto);
        return this.AppInstructionRepository.save(AppInstruction);
    }

    async findAll(): Promise<AppInstructions[]> {
        const queryBuilder = this.AppInstructionRepository.createQueryBuilder('AppInstruction');
        const items = await queryBuilder.getMany();
        return items
    }

    findOne(id: string) {
        return this.AppInstructionRepository.findOne({
            where: { id }
        });
    }

    update(id: string, dto: UpdateAppInstructionDto) {
        return this.AppInstructionRepository.update(id, dto);
    }

    remove(id: string) {
        return this.AppInstructionRepository.softDelete(id);
    }

    restore(id: string) {
        return this.AppInstructionRepository.restore(id);
    }

    permanentRemove(id: string) {
        return this.AppInstructionRepository.delete(id);
    }


}



