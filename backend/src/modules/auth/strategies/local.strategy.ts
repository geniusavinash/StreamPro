import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    username: string,
    password: string,
  ): Promise<any> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    try {
      const result = await this.authService.login(
        { username, password },
        ipAddress,
        userAgent,
      );
      return result;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}