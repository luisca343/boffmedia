import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, Logger } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { StarbankService } from '../starbank/starbank.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';

@ApiTags('smartrotom/users')
@Controller('/smartrotom/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: SmartRotomUsersService,
    private readonly starbankService: StarbankService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  async findAll() {
    const action = 'find all users';
    try {
      this.responseService.logRequest(action, null);
      const users = await this.usersService.findAll();
      this.responseService.logSuccess(action, users);
      return this.responseService.createSuccessResponse('Users retrieved successfully', users);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create user.' })
  async create(@Body() createUserDto: CreateSmartrotomUserDto) {
    const action = 'create user';
    try {
      this.responseService.logRequest(action, createUserDto);
      const user = await this.usersService.create(createUserDto);
      this.responseService.logSuccess(action, user);
      return this.responseService.createSuccessResponse('User created successfully', user);
    } catch (error) {
      this.responseService.handleError(action, error, createUserDto);
    }
  }

  @Post('findUser')
  @ApiOperation({ summary: 'Find or create a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User found or created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find or create user.' })
  async findUser(@Body() mcUser: CreateSmartrotomUserDto, @Res() res: Response) {
    const action = 'find or create user';
    try {
      this.responseService.logRequest(action, mcUser);
      let user = await this.usersService.findOne(mcUser.uuid);
      if (user) {
        this.responseService.logSuccess(action, user);
        return res.status(HttpStatus.OK).send(user);
      }

      const insert = await this.usersService.create(mcUser);
      if (insert) {
        this.responseService.logSuccess(action, insert);
        return res.status(HttpStatus.CREATED).send(insert);
      }

      throw new Error('User not created');
    } catch (error) {
      this.responseService.handleError(action, error, mcUser);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).send(`User not created: ${mcUser.uuid}`);
    }
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize user and accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User and accounts initialized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initialize user and accounts.' })
  async initialize(@Body() data: CreateSmartrotomUserDto) {
    const action = 'initialize user and accounts';
    try {
      this.responseService.logRequest(action, data);
      let user = await this.usersService.findOne(data.uuid);
      if (!user) await this.usersService.create({ uuid: data.uuid, username: data.username, world: data.world });
      user = await this.usersService.findOne(data.uuid);

      let accounts = await this.starbankService.getAccounts(data.uuid);
      if (accounts.length === 0) {
        await this.starbankService.createMainAccount(data.uuid, data.username);
      }
      accounts = await this.starbankService.getAccounts(data.uuid);

      const result = { user, accounts };
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('User and accounts initialized successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, data);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete user.' })
  async remove(@Param('id') id: string) {
    const action = 'delete user';
    try {
      this.responseService.logRequest(action, { id });
      const result = await this.usersService.remove(+id);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('User deleted successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update user.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const action = 'update user';
    try {
      this.responseService.logRequest(action, { id, updateUserDto });
      const user = await this.usersService.update(+id, updateUserDto);
      this.responseService.logSuccess(action, user);
      return this.responseService.createSuccessResponse('User updated successfully', user);
    } catch (error) {
      this.responseService.handleError(action, error, { id, updateUserDto });
    }
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user.' })
  async findOne(@Param('uuid') uuid: string) {
    const action = 'find user by UUID';
    try {
      this.responseService.logRequest(action, { uuid });
      const user = await this.usersService.findOne(uuid);
      this.responseService.logSuccess(action, user);
      return this.responseService.createSuccessResponse('User retrieved successfully', user);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }
}