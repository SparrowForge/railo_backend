import { IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCommentsDto {
    @IsString()
    @MaxLength(2000)
    text: string;

    @IsNumber()
    @IsOptional()
    file_id: number;
}
