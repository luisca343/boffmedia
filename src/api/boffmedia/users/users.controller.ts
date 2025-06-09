import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpException
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { BoffMediaUsersFacadeService } from './users.facade.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Additional DTOs for specialized endpoints
export class MinecraftRegistrationDto {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

export class MinecraftLinkDto {
  username: string;
  email: string;
  password: string;
  minecraft: {
    username: string;
    uuid: string;
    world: string;
  };
}

export class GoogleAuthDto {
  email: string;
  name: string;
  googleId: string;
  profilePicture?: string;
}

export class LoginDto {
  username: string;
  password: string;
}

@ApiTags('BoffMedia Users')
@Controller('boffmedia/users')
export class BoffMediaUsersController {
  constructor(
    private readonly usersFacadeService: BoffMediaUsersFacadeService,
  ) {}

  // ==================== USER CREATION ====================

  @Post()
  @ApiOperation({ summary: 'Create a new BoffMedia user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.usersFacadeService.createUser({
        email: createUserDto.email,
        username: createUserDto.username,
        password: createUserDto.password,
        uuid: createUserDto.mc_uuid
      });

      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('minecraft/register')
  @ApiOperation({ summary: 'Register a new user with Minecraft integration' })
  @ApiResponse({ status: 201, description: 'User registered with full integration' })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  @ApiBody({ type: MinecraftRegistrationDto })
  async registerMinecraftUser(@Body() registerData: MinecraftRegistrationDto) {
    try {
      const result = await this.usersFacadeService.createMinecraftUser(registerData);

      return {
        user: result.boffMediaUser,
        smartRotomUser: result.smartRotomUser,
        starbankAccounts: result.starbankAccounts,
        isNewBoffMediaUser: result.isNewBoffMediaUser,
        isNewSmartRotomUser: result.isNewSmartRotomUser
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('minecraft/link')
  @ApiOperation({ summary: 'Link existing user to Minecraft account' })
  @ApiResponse({ status: 200, description: 'Minecraft account linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid linking data' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: MinecraftLinkDto })
  async linkMinecraftAccount(@Body() linkData: MinecraftLinkDto) {
    try {
      const result = await this.usersFacadeService.linkMinecraftAccount(linkData);

      return {
        boffMediaUser: result.boffMediaUser,
        smartRotomUser: result.smartRotomUser,
        starbankAccounts: result.starbankAccounts
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('google/auth')
  @ApiOperation({ summary: 'Authenticate or create user via Google OAuth' })
  @ApiResponse({ status: 200, description: 'Google authentication successful' })
  @ApiResponse({ status: 400, description: 'Invalid Google data' })
  @ApiBody({ type: GoogleAuthDto })
  async googleAuth(@Body() googleData: GoogleAuthDto) {
    try {
      const sessionUser = await this.usersFacadeService.createFromGoogle(googleData);
      return sessionUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== USER RETRIEVAL ====================

  @Get()
  @ApiOperation({ summary: 'Get all BoffMedia users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  async findAll(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    try {
      const users = await this.usersFacadeService.getAllUsers();
      
      // Apply pagination if provided
      let paginatedUsers = users;
      if (limit && offset !== undefined) {
        paginatedUsers = users.slice(offset, offset + limit);
      } else if (limit) {
        paginatedUsers = users.slice(0, limit);
      }

      return {
        users: paginatedUsers,
        total: users.length,
        limit,
        offset
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get user statistics with integrations' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    try {
      const stats = await this.usersFacadeService.getUserStatistics();
      return stats;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.usersFacadeService.getUserById(id);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/integrations')
  @ApiOperation({ summary: 'Get user with all integrations (SmartRotom, Starbank, Roles)' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User with integrations found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserWithIntegrations(@Param('id', ParseIntPipe) id: number) {
    try {
      const userWithIntegrations = await this.usersFacadeService.getUserWithIntegrations(id.toString(), 'id');
      
      if (!userWithIntegrations) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return userWithIntegrations;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiParam({ name: 'username', type: 'string', description: 'Username' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUsername(@Param('username') username: string) {
    try {
      const user = await this.usersFacadeService.getUserByUsername(username);
      
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('username/:username/full')
  @ApiOperation({ summary: 'Get full user data by username (with SmartRotom data)' })
  @ApiParam({ name: 'username', type: 'string', description: 'Username' })
  @ApiResponse({ status: 200, description: 'Full user data found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findFullUserByUsername(@Param('username') username: string) {
    try {
      const fullUser = await this.usersFacadeService.getFullUserByUsername(username);
      
      if (!fullUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return fullUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get user by email' })
  @ApiParam({ name: 'email', type: 'string', description: 'Email address' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByEmail(@Param('email') email: string) {
    try {
      const sessionUser = await this.usersFacadeService.findByEmail(email);
      
      if (!sessionUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return sessionUser;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Get user roles' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User roles retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserRoles(@Param('id', ParseIntPipe) id: number) {
    try {
      const roles = await this.usersFacadeService.getUserRoles(id);
      return { roles };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== USER UPDATE ====================

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    try {
      const updatedUser = await this.usersFacadeService.updateUser(id, updateUserDto);
      return updatedUser;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== USER DELETION ====================

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const result = await this.usersFacadeService.deleteUser(id);

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return { deleted: true, message: result.message };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== AUTHENTICATION ====================

  @Post('auth/login')
  @ApiOperation({ summary: 'Authenticate user with username and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto) {
    try {
      const authResult = await this.usersFacadeService.validateUser(loginDto.username, loginDto.password);
      
      if (!authResult) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      return authResult;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== BATCH OPERATIONS ====================

  @Post('batch')
  @ApiOperation({ summary: 'Get multiple users with integrations by IDs' })
  @ApiResponse({ status: 200, description: 'Batch users retrieved successfully' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        userIds: { 
          type: 'array', 
          items: { type: 'number' } 
        } 
      } 
    } 
  })
  async getBatchUsersWithIntegrations(@Body() body: { userIds: number[] }) {
    try {
      const { userIds } = body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new HttpException('Valid array of user IDs is required', HttpStatus.BAD_REQUEST);
      }

      const users = await this.usersFacadeService.getMultipleUsersWithIntegrations(userIds);
      return users;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==================== VALIDATION ====================

  @Get('validate/:type/:identifier')
  @ApiOperation({ summary: 'Validate if user exists by different identifiers' })
  @ApiParam({ name: 'type', enum: ['id', 'username', 'email', 'uuid'], description: 'Type of identifier' })
  @ApiParam({ name: 'identifier', type: 'string', description: 'Identifier value' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validateUserExists(
    @Param('type') type: 'id' | 'username' | 'email' | 'uuid',
    @Param('identifier') identifier: string
  ) {
    try {
      const exists = await this.usersFacadeService.validateUserExists(identifier, type);
      return { exists, type, identifier };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}