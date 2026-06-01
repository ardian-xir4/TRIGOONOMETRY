import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AddMoneyDto } from './dto/add-money.dto';

@ApiTags('User Account Profiles')
@Controller('users')
export class UsersController {
  constructor(private authService: AuthService) {}

  @Post('wallet/add')
  @ApiOperation({ summary: 'Deposit testing money into your wallet account balance (No Guard Bypass)' })
  async addFunds(@Body() body: AddMoneyDto) {
    // Pass the target user ID directly from the body input text box
    return this.authService.addFunds(body.userId, body.amount);
  }
}