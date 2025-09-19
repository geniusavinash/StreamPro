import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../../common/enums/permission.enum';

export class CreateApiTokenDto {
  @ApiProperty({
    description: 'Name for the API token',
    example: 'Mobile App Integration',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

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
  })
  @IsArray()
  @IsString({ each: true })
  permissions: Permission[];

  @ApiProperty({
    description: 'Rate limit per hour for this token',
    example: 1000,
    default: 1000,
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
}