import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class CreateTimelineDto {
  @ApiProperty({ example: 'Changed Exhaust System', description: 'Title of the modification log' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Installed a custom straightpipe exhaust system for a deeper note.', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 600.00, description: 'Cost of the modification' })
  @IsNotEmpty()
  @IsNumber()
  cost: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}