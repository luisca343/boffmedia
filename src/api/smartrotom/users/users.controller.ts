import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { UsersFacadeService, UserInitializationData } from './users.facade.service';
import { CreateUserData, UpdateUserData } from '@repositories/smartrotom/users.repository';

@ApiTags('smartrotom/users')
@Controller('smartrotom/users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private readonly usersFacadeService: UsersFacadeService,
  ) {}

  // ==================== BASIC USER OPERATIONS ====================

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  async findAll() {
    return await this.usersFacadeService.getAllUsers();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already exists.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create user.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string' },
        username: { type: 'string' },
        world: { type: 'string' }
      } 
    } 
  })
  async create(@Body() createUserData: CreateUserData) {
    return await this.usersFacadeService.createUser(createUserData);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async findOne(@Param('uuid') uuid: string) {
    const user = await this.usersFacadeService.getUserByUuid(uuid);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update user.' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        username: { type: 'string' },
        world: { type: 'string' }
      } 
    } 
  })
  async update(@Param('id') id: string, @Body() updateUserData: UpdateUserData) {
    return await this.usersFacadeService.updateUser(+id, updateUserData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete user.' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async remove(@Param('id') id: string) {
    return await this.usersFacadeService.deleteUser(+id);
  }

  // ==================== ENHANCED OPERATIONS ====================

  @Post('findUser')
  @ApiOperation({ summary: 'Find or create a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User found successfully.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find or create user.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string' },
        username: { type: 'string' },
        world: { type: 'string' }
      } 
    } 
  })
  async findUser(@Body() userData: CreateUserData) {
    const result = await this.usersFacadeService.findOrCreateUser(userData);
    return {
      user: result.user,
      isNew: result.isNew,
      status: result.isNew ? 'created' : 'found'
    };
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize user and accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User and accounts initialized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initialize user and accounts.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string' },
        username: { type: 'string' },
        world: { type: 'string' }
      } 
    } 
  })
  async initialize(@Body() data: UserInitializationData) {
    return await this.usersFacadeService.initializeUserAndAccounts(data);
  }

  // ==================== USER WITH ACCOUNTS ====================

  @Get(':uuid/accounts')
  @ApiOperation({ summary: 'Get user with their accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User and accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user and accounts.' })
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
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuids: { type: 'array', items: { type: 'string' } }
      } 
    } 
  })
  async getMultipleUsers(@Body() { uuids }: { uuids: string[] }) {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      throw new Error('UUIDs array is required and cannot be empty');
    }
    return await this.usersFacadeService.getMultipleUsers(uuids);
  }

  @Post('batch/accounts')
  @ApiOperation({ summary: 'Get multiple users with their accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users and accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users and accounts.' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuids: { type: 'array', items: { type: 'string' } }
      } 
    } 
  })
  async getMultipleUsersWithAccounts(@Body() { uuids }: { uuids: string[] }) {
    if (!Array.isArray(uuids) || uuids.length === 0) {
      throw new Error('UUIDs array is required and cannot be empty');
    }
    return await this.usersFacadeService.getMultipleUsersWithAccounts(uuids);
  }

  // ==================== STATISTICS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics overview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve statistics.' })
  async getStatistics() {
    return await this.usersFacadeService.getUserStatistics();
  }

  // ==================== VALIDATION ====================

  @Get('validate/:uuid')
  @ApiOperation({ summary: 'Validate if user exists' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User validation result.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async validateUser(@Param('uuid') uuid: string) {
    return { 
      exists: await this.usersFacadeService.validateUserExists(uuid) 
    };
  }
}