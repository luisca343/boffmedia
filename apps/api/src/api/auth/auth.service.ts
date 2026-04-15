import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: BoffMediaUsersFacadeService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.validateUser(username, password);
    if (user) {
      return user;
    }
    return null;
  }

  async login(fullUser: any) {
    const user = fullUser.sessionUser || fullUser;
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
        mcUuid: user.mcUUid,
        smartRotomUser: user.smartRotomUser || {}
      }
    };
  }

  async loginMC(loginData: {username: string, uuid: string, world: string}) {
    if (loginData.world !== process.env.MC_WORLD) {
      throw new UnauthorizedException('Invalid world');
    }

    const user = await this.usersService.getUserWithIntegrations(loginData.uuid, "uuid");
    if (!user) {
      return { error: 'User not found in BoffMedia system' };
    }

    const loginUser = {
      sessionUser: {
        id: user.boffMediaUser.id,
        name: user.boffMediaUser.username,
        email: user.boffMediaUser.email,
        roles: user.roles,
        mcUUid: user.boffMediaUser.uuid,
        smartRotomUser: user.smartRotomUser
      }
    };

    return this.login(loginUser);
  }

  async registerMinecraft(registerData: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    // Validate world
    if (registerData.minecraft.world !== process.env.MC_WORLD) {
      throw new UnauthorizedException('Invalid world');
    }

    try {
      // Create the user accounts
      const result = await this.usersService.createMinecraftUser(registerData);
      
      // Get the created user with all integrations for login
      const userWithIntegrations = await this.usersService.getUserWithIntegrations(
        result.boffMediaUser.id.toString(), 
        'id'
      );

      if (!userWithIntegrations) {
        return { error: 'Failed to retrieve created user' };
      }

      // Convert to the format expected by login
      const loginUser = {
        id: userWithIntegrations.boffMediaUser.id,
        name: userWithIntegrations.boffMediaUser.username,
        email: userWithIntegrations.boffMediaUser.email,
        roles: userWithIntegrations.roles,
        mcUUid: userWithIntegrations.boffMediaUser.uuid,
        smartRotomUser: userWithIntegrations.smartRotomUser
      };

      return this.login(loginUser);
    } catch (error: any) {
      console.error('Minecraft registration error:', error);
      return { error: error.message || 'Registration failed' };
    }
  }

  async linkMinecraft(linkData: {
    username: string;
    email: string;
    password: string;
    minecraft: {
      username: string;
      uuid: string;
      world: string;
    };
  }) {
    // Validate world
    if (linkData.minecraft.world !== process.env.MC_WORLD) {
      throw new UnauthorizedException('Invalid world');
    }

    try {
      // Link the Minecraft account to existing BoffMedia account
      const result = await this.usersService.linkMinecraftAccount(linkData);
      
      // Get the user with all integrations for login
      const userWithIntegrations = await this.usersService.getUserWithIntegrations(
        result.boffMediaUser.id.toString(), 
        'id'
      );

      if (!userWithIntegrations) {
        return { error: 'Failed to retrieve linked user' };
      }

      // Convert to the format expected by login
      const loginUser = {
        id: userWithIntegrations.boffMediaUser.id,
        name: userWithIntegrations.boffMediaUser.username,
        email: userWithIntegrations.boffMediaUser.email,
        roles: userWithIntegrations.roles,
        mcUUid: userWithIntegrations.boffMediaUser.uuid,
        smartRotomUser: userWithIntegrations.smartRotomUser
      };

      return this.login(loginUser);
    } catch (error: any) {
      console.error('Minecraft linking error:', error);
      return { error: error.message || 'Linking failed' };
    }
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
      const user = await this.usersService.getUserById(payload.sub || payload.id);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get fresh roles
      const roles = await this.usersService.getUserRoles(user.id);

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
          image: user.profilePicture || null,
          smartRotomUser: payload.smartRotomUser || {}
        }
      };
    } catch (error: any) {
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