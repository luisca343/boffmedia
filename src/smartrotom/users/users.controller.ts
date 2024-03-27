import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { SmartRotomUsersService } from './users.service';
import { CreateSmartrotomUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmartrotomUser } from './entities/user.entity';
import { Response } from 'express';
import { StarbankService } from '../starbank/starbank.service';

@Controller('/smartrotom/users')
export class UsersController {
  constructor(
    private usersService: SmartRotomUsersService,
    private starbankService: StarbankService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateSmartrotomUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post('initialize')
  async initialize(@Body() data: {uuid:string, username: string, world:string}) {
    // Check if user exists, if not, create it
    let user = await this.usersService.findOne(data.uuid);
    if(!user) await this.usersService.create({uuid: data.uuid, username: data.username, world: data.world});
    user = await this.usersService.findOne(data.uuid);

    console.log(`User exists: ${user}`)

    // Check if user has a main account, if not, create it
    let accounts = await this.starbankService.getAccounts(data.uuid);
    if(accounts.length === 0) await this.starbankService.createMainAccount(data.uuid);
    accounts = await this.starbankService.getAccounts(data.uuid);

    console.log(`User has accounts: ${accounts}`)

    return {user, accounts};
  }

  @Post('findUser')
  async findUser(@Body() mcUser: SmartrotomUser, @Res() res: Response) {
    let user = await this.usersService.findOne(mcUser.uuid);
    if (user) {
      console.log("USUARIO ENCONTRADO: " + mcUser.uuid);
      console.log(user);

      return res.status(200).send(user);
    }

    console.log("User not found: " + mcUser.uuid);
    // Create user
    let insert = await this.usersService.create(mcUser);
    if (insert) {
      console.log("User created: " + mcUser.uuid);
      console.log(insert);
      return res.status(201).send(insert);
    }
    
    
    console.log("User not created: " + mcUser.uuid);

    return res.status(500).send("User not created: " + mcUser.uuid);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.usersService.findOne(uuid);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
