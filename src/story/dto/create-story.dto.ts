import { StoryVisibilityEnum } from "../entities/story_visibility.enum";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsNotEmpty } from "class-validator";

export class CreateStoryDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsInt({ each: true })
    @IsNotEmpty()
    file_id: number[];

    @IsEnum(StoryVisibilityEnum, { message: `visibility must be one of: ${Object.values(StoryVisibilityEnum).join(', ')}`, })
    @IsNotEmpty()
    visibility: StoryVisibilityEnum;
}
