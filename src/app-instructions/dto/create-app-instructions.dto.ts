import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { AppInstructionsEnum } from "src/common/enums/app-instructions.enum";

export class CreateAppInstructionDto {
    @ApiProperty({ description: `AppInstructionsEnum must be within ${Object.values(AppInstructionsEnum).join(', ')}`, enum: AppInstructionsEnum, example: AppInstructionsEnum.DistanceLevelsInRillo, })
    @IsEnum(AppInstructionsEnum, { message: `AppInstructionsEnum must be within ${Object.values(AppInstructionsEnum).join(', ')}` })
    @IsNotEmpty()
    particulars: AppInstructionsEnum;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    instruction: string;

    @ApiProperty()
    @IsOptional()
    @IsUUID()
    created_by_id: string;
}

