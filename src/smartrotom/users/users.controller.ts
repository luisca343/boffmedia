import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SmartrotomUser } from './entities/user.entity';
import { Response } from 'express';

@Controller('/smartrotom/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
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
