import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { UsersFacadeService } from './users.facade.service';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateSmartrotomUserDto } from './dto/update-user.dto';
import { UserInitializationDataDto } from './dto/user-initialization-data.dto';
import { BatchUsersRequestDto } from './dto/batch-users-request.dto';
import { SmartRotomUser } from './entities/user.entity';
import { InitializationResult } from './entities/initialization-result.entity';
import { UserWithAccounts } from './entities/user-with-accounts.entity';
import { FindOrCreateResult } from './entities/find-or-create-result.entity';
import { UserStatistics } from './entities/user-statistics.entity';
import { UserValidationResult } from './entities/user-validation-result.entity';

@ApiTags('SmartRotom | Users')
@Controller('smartrotom/users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(private readonly usersFacadeService: UsersFacadeService) {}

  // ==================== BASIC USER OPERATIONS ====================

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully.',
    type: [SmartRotomUser],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve users.',
  })
  async findAll(): Promise<SmartRotomUser[]> {
    return this.usersFacadeService.getAllUsers() as unknown as SmartRotomUser[];
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully.',
    type: SmartRotomUser,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create user.',
  })
  async create(
    @Body() createUserDto: CreateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    return this.usersFacadeService.createUser(createUserDto) as unknown as SmartRotomUser;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: SmartRotomUser,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SmartRotomUser> {
    return this.usersFacadeService.getUserById(id) as unknown as SmartRotomUser;
  }

  @Get('uuid/:uuid')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully.',
    type: SmartRotomUser,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid UUID format.',
  })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async findByUuid(@Param('uuid') uuid: string): Promise<SmartRotomUser> {
    const user = await this.usersFacadeService.getUserByUuid(uuid);
    if (!user) {
      throw new Error('User not found');
    }
    return user as unknown as SmartRotomUser;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully.',
    type: SmartRotomUser,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username already taken.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateSmartrotomUserDto,
  ): Promise<SmartRotomUser> {
    return this.usersFacadeService.updateUser(id, updateUserDto) as unknown as SmartRotomUser;
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
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid ID format.',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: 'number' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersFacadeService.deleteUser(id);
  }

  // ==================== ENHANCED OPERATIONS ====================

  @Post('find-or-create')
  @ApiOperation({ summary: 'Find or create a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found or created successfully.',
    type: FindOrCreateResult,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username already taken.',
  })
  async findOrCreateUser(
    @Body() createUserDto: CreateSmartrotomUserDto,
  ): Promise<FindOrCreateResult> {
    const result =
      await this.usersFacadeService.findOrCreateUser(createUserDto);
    return {
      user: result.user,
      isNew: result.isNew,
      status: result.isNew ? 'created' : 'found',
    } as unknown as FindOrCreateResult;
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize user and accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User and accounts initialized successfully.',
    type: InitializationResult,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  async initialize(
    @Body() data: UserInitializationDataDto,
  ): Promise<InitializationResult> {
    return this.usersFacadeService.initializeUserAndAccounts(data) as unknown as InitializationResult;
  }

  // ==================== USER WITH ACCOUNTS ====================

  @Get(':uuid/accounts')
  @ApiOperation({ summary: 'Get user with their accounts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User and accounts retrieved successfully.',
    type: UserWithAccounts,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserWithAccounts(
    @Param('uuid') uuid: string,
  ): Promise<UserWithAccounts> {
    const result = await this.usersFacadeService.getUserWithAccounts(uuid);
    if (!result) {
      throw new Error('User not found');
    }
    return result as unknown as UserWithAccounts;
  }

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
          { type: 'null' },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data.',
  })
  async getMultipleUsers(
    @Body() request: BatchUsersRequestDto,
  ): Promise<{ [uuid: string]: SmartRotomUser | null }> {
    return this.usersFacadeService.getMultipleUsers(request.uuids) as unknown as { [uuid: string]: SmartRotomUser | null };
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
          { $ref: '#/components/schemas/UserWithAccounts' },
          { type: 'null' },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data.',
  })
  async getMultipleUsersWithAccounts(
    @Body() request: BatchUsersRequestDto,
  ): Promise<{ [uuid: string]: UserWithAccounts | null }> {
    return this.usersFacadeService.getMultipleUsersWithAccounts(request.uuids) as unknown as { [uuid: string]: UserWithAccounts | null };
  }

  // ==================== STATISTICS ====================

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get user statistics overview' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully.',
    type: UserStatistics,
  })
  async getStatistics(): Promise<UserStatistics> {
    return this.usersFacadeService.getUserStatistics();
  }

  // ==================== VALIDATION ====================

  @Get('validate/:uuid')
  @ApiOperation({ summary: 'Validate if user exists' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User validation result.',
    type: UserValidationResult,
  })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async validateUser(
    @Param('uuid') uuid: string,
  ): Promise<UserValidationResult> {
    return {
      exists: await this.usersFacadeService.validateUserExists(uuid),
    };
  }
}
