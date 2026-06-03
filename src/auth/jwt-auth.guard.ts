import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers.authorization;

    if (!authHeader && process.env.NODE_ENV !== 'production') {
      request.user = { 
        role: 'angelic goodest dogboyprincess' 
      };
      return true;
    }

    if (!authHeader) {
      throw new UnauthorizedException('nuh uh');
    }

    const parts = authHeader.split(' ');
    const token = parts.length === 2 ? parts[1] : authHeader;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'SUPER_SECRET_LOCAL_FALLBACK_123',
      });
      
      request.user = {
        userId: payload.sub || payload.id || payload.userId,
        email: payload.email,
        role: payload.role || payload.roles,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Token verification failed');
    }
  }
}