import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Permission, ROLE_PERMISSIONS } from '../../../common/enums/permission.enum';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check if a user has any of the specified permissions
   */
  hasAnyPermission(user: User, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if a user has all of the specified permissions
   */
  hasAllPermissions(user: User, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Get all permissions for a user role
   */
  getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(user: User): Permission[] {
    return this.getPermissionsForRole(user.role);
  }

  /**
   * Check if a role can perform an action on a resource
   */
  canAccessResource(
    user: User,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
  ): boolean {
    const permissionKey = `${resource}:${action}` as Permission;
    return this.hasPermission(user, permissionKey);
  }

  /**
   * Get role hierarchy (higher roles include lower role permissions)
   */
  getRoleHierarchy(): Record<UserRole, UserRole[]> {
    return {
      [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER, UserRole.API_ONLY],
      [UserRole.OPERATOR]: [UserRole.OPERATOR, UserRole.VIEWER],
      [UserRole.VIEWER]: [UserRole.VIEWER],
      [UserRole.API_ONLY]: [UserRole.API_ONLY],
    };
  }

  /**
   * Check if user role is higher than or equal to required role
   */
  hasRoleOrHigher(user: User, requiredRole: UserRole): boolean {
    const hierarchy = this.getRoleHierarchy();
    const userRoles = hierarchy[user.role] || [];
    return userRoles.includes(requiredRole);
  }

  /**
   * Get permission summary for a user
   */
  getPermissionSummary(user: User): {
    role: UserRole;
    permissions: Permission[];
    canManageCameras: boolean;
    canManageUsers: boolean;
    canViewDashboard: boolean;
    canAccessSystem: boolean;
  } {
    const permissions = this.getUserPermissions(user);

    return {
      role: user.role,
      permissions,
      canManageCameras: this.hasAnyPermission(user, [
        Permission.CAMERA_CREATE,
        Permission.CAMERA_UPDATE,
        Permission.CAMERA_DELETE,
      ]),
      canManageUsers: this.hasAnyPermission(user, [
        Permission.USER_CREATE,
        Permission.USER_UPDATE,
        Permission.USER_DELETE,
      ]),
      canViewDashboard: this.hasPermission(user, Permission.DASHBOARD_VIEW),
      canAccessSystem: this.hasAnyPermission(user, [
        Permission.SYSTEM_SETTINGS,
        Permission.SYSTEM_LOGS,
        Permission.SYSTEM_MONITORING,
      ]),
    };
  }
}