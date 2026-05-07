import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class SendWelcomeEmailDto {
    @ApiProperty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsString()
    name: string;
}