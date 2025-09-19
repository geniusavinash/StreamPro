import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiTokenService } from '../services/api-token.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(
    private readonly apiTokenService: ApiTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    // Check if it's an API token (starts with "Bearer csp_")
    if (authHeader.startsWith('Bearer csp_')) {
      const token = await this.apiTokenService.validateToken(authHeader);
      
      if (!token) {
        throw new UnauthorizedException('Invalid or expired API token');
      }

      // Attach token and user to request
      request.apiToken = token;
      request.user = token.user;
      
      return true;
    }

    // If not an API token, let JWT guard handle it
    return false;
  }
}