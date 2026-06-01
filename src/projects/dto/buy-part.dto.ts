import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class BuyPartDto {
  @ApiProperty({ example: 1, description: 'The ID of the target project car build' })
  @IsNotEmpty()
  @IsNumber()
  projectId: number;

  @ApiProperty({ example: 1, description: 'The ID of the marketplace part listing' })
  @IsNotEmpty()
  @IsNumber()
  partListingId: number;
}