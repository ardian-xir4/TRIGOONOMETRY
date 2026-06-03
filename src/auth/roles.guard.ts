import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 🛠️ DEV BACKDOOR OVERRIDE: If you are running locally, bypass the role check entirely
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      return false;
    }

    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}