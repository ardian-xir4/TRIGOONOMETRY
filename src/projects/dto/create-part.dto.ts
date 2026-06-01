import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsPositive } from 'class-validator';

export class CreatePartDto {
  @ApiProperty({ example: 'Garrett G25 Turbocharger', description: 'Name of the modification part' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 2499.99, description: 'Price of the part' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;
}