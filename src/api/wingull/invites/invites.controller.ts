import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateInviteDto } from './dto/update-invite.dto';

import { Response } from 'express';
import { RegisterDataDto } from './dto/register-data.dto';

@Controller('wingull/invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  create(@Body() createInviteDto: CreateInviteDto) {
    return this.invitesService.create(createInviteDto);
  }

  @Get()
  findAll() {
    return this.invitesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response){
    console.log("ID: " + id);
    let invite = await this.invitesService.findOne(id);

    if(invite) return res.status(200).send({
      "statusCode": 200,
      "data": invite
      
    });
    return res.status(200).send(
      {
        "statusCode": 404,
        "error": "Not Found",
        "message": "Invite not found"
      }
    );
  }

  @Post(':id/register')
  register(@Body('values') registerData: RegisterDataDto, @Body('id') id: string){
    return this.invitesService.register(id, registerData);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInviteDto: UpdateInviteDto) {
    return this.invitesService.update(+id, updateInviteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invitesService.remove(+id);
  }
}
