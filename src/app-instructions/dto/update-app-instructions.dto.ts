import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { AppInstructionsEnum } from "../entities/app-instructions.enum";
import { Entity } from "typeorm";

@Entity('rillo_app_instructions')
export class UpdateAppInstructionDto {
    @ApiProperty({ description: `AppInstructionsEnum must be within ${Object.values(AppInstructionsEnum).join(', ')}`, enum: AppInstructionsEnum, example: AppInstructionsEnum.DistanceLevelsInRillo, })
    @IsEnum(AppInstructionsEnum, { message: `AppInstructionsEnum must be within ${Object.values(AppInstructionsEnum).join(', ')}` })
    @IsNotEmpty()
    particulars: AppInstructionsEnum;

    @IsString()
    @IsNotEmpty()
    instruction: string;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    sorting_no: number = 0;
}

