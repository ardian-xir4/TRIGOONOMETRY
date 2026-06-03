import { Controller, Post, Get, Body, UseGuards, Req, BadRequestException} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service'; // <-- Added to fix this.prisma
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthDto } from './dto/auth.dto';
import { AddMoneyDto } from './dto/add-money.dto'; 
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication & Testing Profiles')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService, // <-- Injected Prisma here
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new driver account' })
  async register(@Body() body: AuthDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in to receive your Bearer access token' })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('wallet/add')
  @ApiOperation({ summary: 'Deposit testing money directly via raw Body parameters' })
  async addFunds(@Body() body: AddMoneyDto) {
    return this.authService.addFunds(body.userId, body.amount);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'stalk on other guys' })
  async getProfile(@Req() req: any) {
    // Fetches the logged-in user profile and returns it cleanly
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullname: true,
        role: true,
        createdAt: true,
      },
    });
    
    return user; // <-- Added return so Swagger actually gets the data back
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check current wallet balance' })
  async getWalletBalance(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        wallet: true, // Only grabs the wallet field from the database
      },
    });

    if (!user) {
      throw new BadRequestException('Account not found');
    }

    return {
      currentBalance: user.wallet,
    };
  }
}