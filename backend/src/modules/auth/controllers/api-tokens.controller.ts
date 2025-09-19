import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiTokenService } from '../services/api-token.service';
import { CreateApiTokenDto } from '../dto/create-api-token.dto';
import { UpdateApiTokenDto } from '../dto/update-api-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { User } from '../../../database/entities/user.entity';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Permission } from '../../../common/enums/permission.enum';

@ApiTags('API Tokens')
@Controller('api-tokens')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ApiTokensController {
  constructor(private readonly apiTokenService: ApiTokenService) {}

  @Post()
  @RequirePermissions(Permission.TOKEN_CREATE)
  @ApiOperation({ summary: 'Create a new API token' })
  @ApiResponse({
    status: 201,
    description: 'API token created successfully',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'object' },
        plainToken: { type: 'string', description: 'The actual token string (only shown once)' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid permissions or bad request',
  })
  async createToken(
    @Body() createTokenDto: CreateApiTokenDto,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const result = await this.apiTokenService.createToken(
      user,
      createTokenDto,
      ipAddress,
      userAgent,
    );

    return {
      message: 'API token created successfully',
      token: {
        id: result.token.id,
        name: result.token.name,
        remark: result.token.remark,
        permissions: result.token.permissions,
        rateLimit: result.token.rateLimit,
        expiresAt: result.token.expiresAt,
        createdAt: result.token.createdAt,
      },
      plainToken: result.plainToken,
      warning: 'Store this token securely. It will not be shown again.',
    };
  }

  @Get()
  @RequirePermissions(Permission.TOKEN_READ)
  @ApiOperation({ summary: 'Get all API tokens' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'Filter by user ID (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API tokens',
  })
  async getTokens(
    @CurrentUser() user: User,
    @Query('userId') userId?: string,
  ) {
    // Non-admin users can only see their own tokens
    const filterUserId = user.role === UserRole.ADMIN ? userId : user.id;
    
    const tokens = await this.apiTokenService.findAllTokens(filterUserId);
    
    // Remove sensitive information
    return tokens.map(token => ({
      id: token.id,
      name: token.name,
      remark: token.remark,
      permissions: token.permissions,
      rateLimit: token.rateLimit,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      isActive: token.isActive,
      createdAt: token.createdAt,
      user: token.user ? {
        id: token.user.id,
        username: token.user.username,
        role: token.user.role,
      } : undefined,
    }));
  }

  @Get(':id')
  @RequirePermissions(Permission.TOKEN_READ)
  @ApiOperation({ summary: 'Get API token by ID' })
  @ApiParam({ name: 'id', description: 'API token ID' })
  @ApiResponse({
    status: 200,
    description: 'API token details',
  })
  @ApiResponse({
    status: 404,
    description: 'API token not found',
  })
  async getToken(@Param('id') id: string, @CurrentUser() user: User) {
    const token = await this.apiTokenService.findTokenById(id);
    
    // Non-admin users can only see their own tokens
    if (user.role !== UserRole.ADMIN && token.userId !== user.id) {
      throw new ForbiddenException('You can only view your own tokens');
    }

    return {
      id: token.id,
      name: token.name,
      remark: token.remark,
      permissions: token.permissions,
      rateLimit: token.rateLimit,
      expiresAt: token.expiresAt,
      lastUsedAt: token.lastUsedAt,
      isActive: token.isActive,
      createdAt: token.createdAt,
      user: token.user ? {
        id: token.user.id,
        username: token.user.username,
        role: token.user.role,
      } : undefined,
    };
  }

  @Put(':id')
  @RequirePermissions(Permission.TOKEN_UPDATE)
  @ApiOperation({ summary: 'Update API token' })
  @ApiParam({ name: 'id', description: 'API token ID' })
  @ApiResponse({
    status: 200,
    description: 'API token updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'API token not found',
  })
  async updateToken(
    @Param('id') id: string,
    @Body() updateTokenDto: UpdateApiTokenDto,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const updatedToken = await this.apiTokenService.updateToken(
      id,
      updateTokenDto,
      user,
      ipAddress,
      userAgent,
    );

    return {
      message: 'API token updated successfully',
      token: {
        id: updatedToken.id,
        name: updatedToken.name,
        remark: updatedToken.remark,
        permissions: updatedToken.permissions,
        rateLimit: updatedToken.rateLimit,
        expiresAt: updatedToken.expiresAt,
        isActive: updatedToken.isActive,
      },
    };
  }

  @Post(':id/revoke')
  @RequirePermissions(Permission.TOKEN_REVOKE)
  @ApiOperation({ summary: 'Revoke API token' })
  @ApiParam({ name: 'id', description: 'API token ID' })
  @ApiResponse({
    status: 200,
    description: 'API token revoked successfully',
  })
  async revokeToken(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.apiTokenService.revokeToken(id, user, ipAddress, userAgent);

    return { message: 'API token revoked successfully' };
  }

  @Delete(':id')
  @RequirePermissions(Permission.TOKEN_DELETE)
  @ApiOperation({ summary: 'Delete API token' })
  @ApiParam({ name: 'id', description: 'API token ID' })
  @ApiResponse({
    status: 200,
    description: 'API token deleted successfully',
  })
  async deleteToken(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Request() req: any,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    await this.apiTokenService.deleteToken(id, user, ipAddress, userAgent);

    return { message: 'API token deleted successfully' };
  }

  @Get('stats/usage')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get API token usage statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'API token usage statistics',
  })
  async getUsageStats() {
    return this.apiTokenService.getTokenUsageStats();
  }

  @Post('cleanup/expired')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cleanup expired API tokens (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Expired tokens cleaned up',
  })
  async cleanupExpiredTokens() {
    const cleanedCount = await this.apiTokenService.cleanupExpiredTokens();
    return {
      message: 'Expired tokens cleaned up successfully',
      cleanedCount,
    };
  }
}