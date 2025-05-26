import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/boffmedia/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (user) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      username: user.name,
      sub: user.id,
      email: user.email,
      roles: user.roles,
      mcUuid: user.mcUUid
    };

    
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user: {
        id: user.id,
        username: user.name,
        email: user.email,
        roles: user.roles,
        mcUuid: user.mcUUid
      }
    };
  }

  async loginMC(loginData: {username: string, uuid: string, world: string}) {
    if (loginData.world !== process.env.MC_WORLD) {
      throw new UnauthorizedException('Invalid world');
    }

    const user = await this.usersService.findFullUserWithUUID(loginData.uuid);
    if (!user) {
      return { error: 'User not found in BoffMedia system' };
    }

    return this.login(user);
  }

  async refreshToken(tokenData: any) {
    try {
      // Handle both string tokens and token objects from NextAuth
      let payload;
      
      if (typeof tokenData === 'string') {
        // If it's a JWT string, verify it
        payload = this.jwtService.verify(tokenData);
      } else if (tokenData && typeof tokenData === 'object') {
        // If it's already a token object (from NextAuth), use it directly
        payload = tokenData;
      } else {
        throw new UnauthorizedException('Invalid token format');
      }

      // Get fresh user data
      const user = await this.usersService.findOne(payload.sub || payload.id);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get fresh roles
      const roles = await this.usersService.getUserRoles(user.id);

      console.log('Refreshing token for user:', user.username, 'with roles:', roles);

      const newPayload = {
        username: user.username,
        sub: user.id,
        email: user.email,
        roles: roles,
        mcUuid: user.uuid
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        refresh_token: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          roles: roles,
          smartRotomUser: payload.smartRotomUser || {}
        }
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async googleLogin(googleUser: any) {
    let user = await this.usersService.findByEmail(googleUser.email);
    
    if (!user) {
      user = await this.usersService.createFromGoogle(googleUser);
    }

    return this.login(user);
  }
}