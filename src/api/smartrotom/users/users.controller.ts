import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, UseInterceptors } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Response } from 'express';
import { StarbankService } from '../starbank/starbank.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('smartrotom/users')
@Controller('/smartrotom/users')
@UseInterceptors(ResponseInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: SmartRotomUsersService,
    private readonly starbankService: StarbankService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve users.' })
  async findAll() {
    return await this.usersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create user.' })
  async create(@Body() createUserDto: CreateSmartrotomUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Post('findUser')
  @ApiOperation({ summary: 'Find or create a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User found or created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to find or create user.' })
  async findUser(@Body() mcUser: CreateSmartrotomUserDto, @Res() res: Response) {
    let user = await this.usersService.findOne(mcUser.uuid);
    if (user) {
      return res.status(HttpStatus.OK).send(user);
    }

    const insert = await this.usersService.create(mcUser);
    if (insert) {
      return res.status(HttpStatus.CREATED).send(insert);
    }

    throw new Error('User not created');
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize user and accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User and accounts initialized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initialize user and accounts.' })
  async initialize(@Body() data: CreateSmartrotomUserDto) {
    let user = await this.usersService.findOne(data.uuid);
    if (!user) await this.usersService.create({ uuid: data.uuid, username: data.username, world: data.world });
    user = await this.usersService.findOne(data.uuid);

    let accounts = await this.starbankService.getAccounts(data.uuid);
    if (accounts.length === 0) {
      await this.starbankService.createMainAccount(data.uuid, data.username);
    }
    accounts = await this.starbankService.getAccounts(data.uuid);

    return { user, accounts };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User deleted successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to delete user.' })
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User updated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to update user.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(+id, updateUserDto);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get a user by UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve user.' })
  async findOne(@Param('uuid') uuid: string) {
    return await this.usersService.findOne(uuid);
  }
}