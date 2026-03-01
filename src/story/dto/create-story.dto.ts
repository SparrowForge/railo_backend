import { StoryVisibilityEnum } from "../entities/story_visibility.enum";
import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";

export class CreateStoryDto {
    @IsNumber()
    @IsNotEmpty()
    file_id: number;

    @IsEnum(StoryVisibilityEnum, { message: `visibility must be one of: ${Object.values(StoryVisibilityEnum).join(', ')}`, })
    @IsNotEmpty()
    visibility: StoryVisibilityEnum;
}