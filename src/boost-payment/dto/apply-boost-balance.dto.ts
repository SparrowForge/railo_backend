import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class ApplyBoostBalanceDto {
  @ApiProperty({ example: '5db0af88-91bf-4a69-b998-0f2a7130f692' })
  @IsUUID()
  postId: string;

  @ApiProperty({
    example: 6,
    description: 'How many remaining boosts to apply to the target post',
  })
  @IsInt()
  @Min(1)
  boostQuantity: number;
}
