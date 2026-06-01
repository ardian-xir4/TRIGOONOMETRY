import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { AddMoneyDto } from './dto/add-money.dto'; // Make sure this is imported

@ApiTags('Authentication & Testing Profiles')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver account' })
  async register(@Body() body: AuthDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in to receive your Bearer access token' })
  async login(@Body() body: AuthDto) {
    return this.authService.login(body);
  }

  @Post('wallet/add')
  @ApiOperation({ summary: 'Deposit testing money directly via raw Body parameters' })
  async addFunds(@Body() body: AddMoneyDto) {
    // CRITICAL FIX: Read directly from body.userId, NOT req.user.userId!
    return this.authService.addFunds(body.userId, body.amount);
  }
}