import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, ROLE_PERMISSIONS } from '../../../common/enums/permission.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}