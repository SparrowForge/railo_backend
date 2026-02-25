import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SaveUsetToTokenMapDto {
  @ApiProperty({ description: 'Horse name', example: 9 })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Horse name',
    example:
      'e9pKM7phFpT6nG4myLsGTO:APA91bGxcIENGymoSa0Pp5WvYpVbO9ytRpZ9L0YQ9cvaFSxuj96fsK7N0BnZ0CeyO0_uQ9xNpSGtWzTQfsPvyo1OyBgn7OOu9VXIJbWE9_PCBZzeEDCIatU',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
