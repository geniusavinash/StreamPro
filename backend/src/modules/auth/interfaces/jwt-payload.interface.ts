import { UserRole } from '../../../common/enums/user-role.enum';

export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string; // user id
  tokenId: string;
  iat?: number;
  exp?: number;
}