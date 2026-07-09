import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InvitesFacadeService } from './invites.facade.service';
import { RegistrationData } from './services/registration.service';
import { CreateInviteBodyDto } from './dto/create-invite-body.dto';

@ApiTags('Wingull | Invites')
@Controller('wingull/invites')
export class InvitesController {
  constructor(private readonly invitesFacadeService: InvitesFacadeService) {}

  // ==================== INVITE OPERATIONS ====================

  @Post()
  @ApiOperation({ summary: 'Create a new invite' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invite created successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid invite data.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create invite.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uuid: { type: 'string', description: 'User UUID' },
        username: { type: 'string', description: 'Username' },
      },
      required: ['uuid', 'username'],
    },
  })
  async createInvite(@Body() body: CreateInviteBodyDto) {
    return await this.invitesFacadeService.createInvite(
      body.uuid,
      body.username,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all invites' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invites retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve invites.',
  })
  async getAllInvites() {
    return await this.invitesFacadeService.getAllInvites();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get invite statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve statistics.',
  })
  async getStatistics() {
    return await this.invitesFacadeService.getInviteStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invite by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invite retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invite not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve invite.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  async getInviteById(@Param('id') id: string) {
    const invite = await this.invitesFacadeService.getInviteById(id);

    if (!invite) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        message: 'Invite not found',
      };
    }

    return invite;
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate invite by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invite validation result.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to validate invite.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  async validateInvite(@Param('id') id: string) {
    return await this.invitesFacadeService.validateInvite(id);
  }

  @Get(':id/can-register')
  @ApiOperation({ summary: 'Check if invite can be used for registration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registration eligibility checked.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to check registration eligibility.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  async canRegister(@Param('id') id: string) {
    return await this.invitesFacadeService.canRegisterWithInvite(id);
  }

  // ==================== REGISTRATION OPERATIONS ====================

  @Post(':id/register')
  @ApiOperation({ summary: 'Register a new user with invite' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invite not found or invalid.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already exists.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to register user.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        values: {
          type: 'object',
          properties: {
            username: { type: 'string', description: 'Username' },
            mc_username: { type: 'string', description: 'Minecraft username' },
            email: { type: 'string', description: 'Email address' },
            password: { type: 'string', description: 'Password' },
          },
          required: ['username', 'mc_username', 'email', 'password'],
        },
      },
      required: ['values'],
    },
  })
  async registerUser(
    @Param('id') id: string,
    @Body('values') registrationData: RegistrationData,
  ) {
    return await this.invitesFacadeService.registerWithInvite(
      id,
      registrationData,
    );
  }

  // ==================== INVITE MANAGEMENT ====================

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete invite by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invite deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invite not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to delete invite.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  async deleteInvite(@Param('id') id: string) {
    return await this.invitesFacadeService.deleteInvite(id);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete invite by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invite permanently deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Invite not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to permanently delete invite.',
  })
  @ApiParam({ name: 'id', description: 'Invite ID' })
  async permanentlyDeleteInvite(@Param('id') id: string) {
    return await this.invitesFacadeService.permanentlyDeleteInvite(id);
  }

  // ==================== USER INVITE OPERATIONS ====================

  @Get('user/:uuid')
  @ApiOperation({ summary: 'Get invites by user UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User invites retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve user invites.',
  })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserInvites(@Param('uuid') uuid: string) {
    return await this.invitesFacadeService.getUserInvites(uuid);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get invites by username' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Username invites retrieved successfully.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve username invites.',
  })
  @ApiParam({ name: 'username', description: 'Username' })
  async getUserInvitesByUsername(@Param('username') username: string) {
    return await this.invitesFacadeService.getUserInvitesByUsername(username);
  }
}
