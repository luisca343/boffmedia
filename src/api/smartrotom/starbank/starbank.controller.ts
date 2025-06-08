import { Body, Controller, Get, Param, Post, Query, HttpStatus, UseInterceptors } from '@nestjs/common';
import { StarbankService } from './starbank.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateAccountDto } from './dto/create-account-dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction-dto';
import { CreateTransferDto } from './dto/create-transfer-dto';
import { TransferFromMainDto } from './dto/transfer-from-main-dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('smartrotom/starbank')
@Controller('smartrotom/starbank')
@UseInterceptors(ResponseInterceptor)
export class StarbankController {
  constructor(
    private readonly starbankService: StarbankService,
  ) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  async getAllAccounts() {
    return await this.starbankService.getAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Account created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create account.' })
  async createAccount(@Body() body: CreateAccountDto) {
    return await this.starbankService.createAccount(body.uuid, body.name);
  }

  @Get('accounts/:uuid')
  @ApiOperation({ summary: 'Get accounts for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  async getAccounts(@Param('uuid') uuid: string) {
    return await this.starbankService.getAccounts(uuid);
  }

  @Get('balance/:uuid')
  @ApiOperation({ summary: 'Get balance for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve balance.' })
  async getBalance(@Param('uuid') uuid: string) {
    return await this.starbankService.getBalance(uuid);
  }

  @Post('shop')
  @ApiOperation({ summary: 'Handle shop transaction' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Shop transaction handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle shop transaction.' })
  async shop(@Body() body: CreateShopTransactionDto) {
    return await this.starbankService.shop(body);
  }

  @Post('trainerdefeat')
  @ApiOperation({ summary: 'Handle trainer defeat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trainer defeat handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle trainer defeat.' })
  async trainerDefeat(@Body() body: TrainerDefeatMoneyDto) {
    return await this.starbankService.trainerDefeat(body.money, body.uuid);
  }

  @Get('transactions/:account')
  @ApiOperation({ summary: 'Get transactions for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transactions retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transactions.' })
  async getTransactions(@Param('account') account: number, @Query('limit') limit: string) {
    return await this.starbankService.getTransactions(account, parseInt(limit));
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle transfer.' })
  async transfer(@Body() body: CreateTransferDto) {
    return await this.starbankService.transfer(body.from, body.to, body.amount, body.concept);
  }

  @Get('transfers/:account')
  @ApiOperation({ summary: 'Get transfers for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfers retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transfers.' })
  async getTransfers(@Param('account') account: number) {
    return await this.starbankService.getTransfers(account);
  }
  
  @Post('transfer/from-main')
  @ApiOperation({ summary: 'Transfer money from user main account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle transfer.' })
  async transferFromMain(@Body() body: TransferFromMainDto) {
    return await this.starbankService.transferFromMain(body.uuid, body.to, body.amount, body.concept);
  }
}