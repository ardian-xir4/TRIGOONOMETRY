import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateListingDto {
  @ApiProperty({ example: 'HKS Hi-Power Exhaust', description: 'Name of the modification part catalog item' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 650.00, description: 'Price of the modification part' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;
}