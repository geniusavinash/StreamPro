import { IsString, IsOptional, IsArray, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../common/enums/permission.enum';

export class UpdateApiTokenDto {
  @ApiProperty({
    description: 'Name for the API token',
    example: 'Mobile App Integration',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Optional remark or description for the token',
    example: 'Token for mobile app to access camera streams',
    required: false,
  })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiProperty({
    description: 'List of permissions for this token',
    example: ['camera:read', 'stream:view'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: Permission[];

  @ApiProperty({
    description: 'Rate limit per hour for this token',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @ApiProperty({
    description: 'Token expiration date (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: 'Whether the token is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}