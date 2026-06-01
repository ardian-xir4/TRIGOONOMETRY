import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class AddMoneyDto {
  @ApiProperty({ example: 1, description: 'The User ID profile to credit money into' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 500.00, description: 'Amount to add to wallet' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;
}