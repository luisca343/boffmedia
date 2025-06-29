import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { UsersFacadeService, UserInitializationData } from './users.facade.service';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateSmartrotomUserDto } from './dto/update-user.dto';
import { SmartRotomUser } from './entities/user.entity';

@ApiTags('SmartRotom | Users')
@Controller('smartrotom/users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private readonly usersFacadeService: UsersFacadeService,
  ) {}

  // ==================== BASIC USER OPERATIONS ====================

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users retrieved successfully.',
    type: [SmartRotomUser]
  })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  async findAll(): Promise<SmartRotomUser[]> {
    return this.usersFacadeService.getAllUsers();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User created successfully.',
    type: SmartRotomUser
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already exists.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create user.' })
  async create(@Body() createUserDto: CreateSmartrotomUserDto): Promise<SmartRotomUser> {
    return this.usersFacadeService.createUser(createUserDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User retrieved successfully.',
    type: SmartRotomUser
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SmartRotomUser> {
    return this.usersFacadeService.getUserById(id);
  }

  @Get('uuid/:uuid')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User retrieved successfully.',
    type: SmartRotomUser
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid UUID format.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async findByUuid(@Param('uuid') uuid: string): Promise<SmartRotomUser> {
    const user = await this.usersFacadeService.getUserByUuid(uuid);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User updated successfully.',
    type: SmartRotomUser
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Username already taken.' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUserDto: UpdateSmartrotomUserDto
  ): Promise<SmartRotomUser> {
    return this.usersFacadeService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid ID format.' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean; message: string }> {
    return this.usersFacadeService.deleteUser(id);
  }

  // ==================== ENHANCED OPERATIONS ====================

  @Post('find-or-create')
  @ApiOperation({ summary: 'Find or create a user' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User found or created successfully.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/SmartRotomUser' },
        isNew: { type: 'boolean' },
        status: { type: 'string', enum: ['found', 'created'] }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Username already taken.' })
  async findOrCreateUser(@Body() createUserDto: CreateSmartrotomUserDto) {
    const result = await this.usersFacadeService.findOrCreateUser(createUserDto);
    return {
      user: result.user,
      isNew: result.isNew,
      status: result.isNew ? 'created' : 'found'
    };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize user and accounts' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User and accounts initialized successfully.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/SmartRotomUser' },
        accounts: { type: 'array', items: { type: 'object' } },
        isNewUser: { type: 'boolean' },
        isNewAccount: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['uuid', 'username'],
      properties: {
        uuid: { type: 'string', format: 'uuid' },
        username: { type: 'string', minLength: 3, maxLength: 16 },
        world: { type: 'string', maxLength: 32 }
      }
    }
  })
  async initialize(@Body() data: UserInitializationData) {
    return this.usersFacadeService.initializeUserAndAccounts(data);
  }

  // ==================== USER WITH ACCOUNTS ====================

  @Get(':uuid/accounts')
  @ApiOperation({ summary: 'Get user with their accounts' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User and accounts retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        user: { $ref: '#/components/schemas/SmartRotomUser' },
        accounts: { type: 'array', items: { type: 'object' } }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserWithAccounts(@Param('uuid') uuid: string) {
    const result = await this.usersFacadeService.getUserWithAccounts(uuid);
    if (!result) {
      throw new Error('User not found');
    }
    return result;
  }

  // ==================== BATCH OPERATIONS ====================

  @Post('batch')
  @ApiOperation({ summary: 'Get multiple users by UUIDs' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users retrieved successfully.',
    schema: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          { $ref: '#/components/schemas/SmartRotomUser' },
          { type: 'null' }
        ]
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['uuids'],
      properties: {
        uuids: { 
          type: 'array', 
          items: { type: 'string', format: 'uuid' },
          minItems: 1
        }
      }
    }
  })
  async getMultipleUsers(@Body() { uuids }: { uuids: string[] }) {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      throw new Error('UUIDs array is required and cannot be empty');
    }
    return this.usersFacadeService.getMultipleUsers(uuids);
  }

  @Post('batch/accounts')
  @ApiOperation({ summary: 'Get multiple users with their accounts' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Users and accounts retrieved successfully.',
    schema: {
      type: 'object',
      additionalProperties: {
        oneOf: [
          {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/SmartRotomUser' },
              accounts: { type: 'array', items: { type: 'object' } }
            }
          },
          { type: 'null' }
        ]
      }
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['uuids'],
      properties: {
        uuids: { 
          type: 'array', 
          items: { type: 'string', format: 'uuid' },
          minItems: 1
        }
      }
    }
  })
  async getMultipleUsersWithAccounts(@Body() { uuids }: { uuids: string[] }) {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      throw new Error('UUIDs array is required and cannot be empty');
    }
    return this.usersFacadeService.getMultipleUsersWithAccounts(uuids);
  }

  // ==================== STATISTICS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics overview' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        usersWithAccounts: { type: 'number' },
        usersWithoutAccounts: { type: 'number' }
      }
    }
  })
  async getStatistics() {
    return this.usersFacadeService.getUserStatistics();
  }

  // ==================== VALIDATION ====================

  @Get('validate/:uuid')
  @ApiOperation({ summary: 'Validate if user exists' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User validation result.',
    schema: {
      type: 'object',
      properties: {
        exists: { type: 'boolean' }
      }
    }
  })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async validateUser(@Param('uuid') uuid: string) {
    return { 
      exists: await this.usersFacadeService.validateUserExists(uuid) 
    };
  }
}