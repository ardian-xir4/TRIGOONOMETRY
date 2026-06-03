import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If the route doesn't explicitly restrict access by role, let it pass
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) return false;

    // Normalize role layouts (handles both single strings and full arrays)
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    
    // Check if the user possesses at least one matching clearance string
    return requiredRoles.some((role) => userRoles.includes(role));
  }
}