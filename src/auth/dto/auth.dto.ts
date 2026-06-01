import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AuthDto {
  @ApiProperty({ example: 'majo@example.com', description: 'The email address of the account' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'gataw123', description: 'Account password (minimum 6 characters)' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}