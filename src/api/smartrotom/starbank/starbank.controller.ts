import { Body, Controller, Get, Param, Post, Query, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { StarbankFacadeService } from './starbank.facade.service';
import { CreateAccountDto } from './dto/create-account-dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction-dto';
import { CreateTransferDto } from './dto/create-transfer-dto';
import { TransferFromMainDto } from './dto/transfer-from-main-dto';
import { ShopTransactionData } from './services/starbank-account.service';

@ApiTags('SmartRotom | Starbank')
@Controller('smartrotom/starbank')
@UseInterceptors(ResponseInterceptor)
export class StarbankController {
  constructor(
    private readonly starbankFacadeService: StarbankFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  async getAllAccounts() {
    return await this.starbankFacadeService.getAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Account created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid account data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create account.' })
  async createAccount(@Body() body: CreateAccountDto) {
    return await this.starbankFacadeService.createAccount(body.uuid, body.name);
  }

  @Post('accounts/main')
  @ApiOperation({ summary: 'Create a main account for a user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Main account created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid user data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create main account.' })
  async createMainAccount(@Body() body: CreateAccountDto) {
    return await this.starbankFacadeService.createMainAccount(body.uuid, body.name);
  }
  
  @Get('accounts/:uuid')
  @ApiOperation({ summary: 'Get accounts for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found or no accounts.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getAccounts(@Param('uuid') uuid: string) {
    return await this.starbankFacadeService.getAccounts(uuid);
  }

  @Get('balance/:uuid')
  @ApiOperation({ summary: 'Get balance for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve balance.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getBalance(@Param('uuid') uuid: string) {
    return await this.starbankFacadeService.getBalance(uuid);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer completed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid transfer data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to process transfer.' })
  async transfer(@Body() body: CreateTransferDto) {
    return await this.starbankFacadeService.transfer(
      body.from,
      body.to,
      body.amount,
      body.concept
    );
  }

  @Post('transfer/from-main')
  @ApiOperation({ summary: 'Transfer money from user main account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer from main completed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid transfer data.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Main account not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to process transfer.' })
  async transferFromMain(@Body() body: TransferFromMainDto) {
    return await this.starbankFacadeService.transferFromMain(
      body.uuid,
      body.to,
      body.amount,
      body.concept
    );
  }

  @Post('shop')
  @ApiOperation({ summary: 'Process shop transaction (buy/sell)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Shop transaction processed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid transaction data or insufficient balance.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to process shop transaction.' })
  async shop(@Body() body: ShopTransactionData) {
    return await this.starbankFacadeService.shop(body);
  }

  @Post('trainerdefeat')
  @ApiOperation({ summary: 'Process trainer defeat reward' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trainer defeat reward processed successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid reward data.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to process trainer defeat reward.' })
  async trainerDefeat(@Body() body: TrainerDefeatMoneyDto) {
    return await this.starbankFacadeService.trainerDefeat(body.money, body.uuid);
  }

  // ==================== TRANSACTION HISTORY ====================

  @Get('transactions/:account')
  @ApiOperation({ summary: 'Get transaction history for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transaction history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Account not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transaction history.' })
  @ApiParam({ name: 'account', description: 'Account ID' })
  @ApiQuery({ name: 'limit', description: 'Number of transactions to retrieve', required: false })
  async getTransactions(
    @Param('account') account: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.starbankFacadeService.getTransactions(+account, limitNum);
  }

  @Get('transactions/user/:uuid')
  @ApiOperation({ summary: 'Get transaction history for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User transaction history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transaction history.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  @ApiQuery({ name: 'limit', description: 'Number of transactions to retrieve', required: false })
  async getTransactionsByUUID(
    @Param('uuid') uuid: string,
    @Query('limit') limit?: string
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.starbankFacadeService.getTransactionsByUUID(uuid, limitNum);
  }

  @Get('transfers/:account')
  @ApiOperation({ summary: 'Get transfer history for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Account not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transfer history.' })
  @ApiParam({ name: 'account', description: 'Account ID' })
  async getTransfers(@Param('account') account: string) {
    return await this.starbankFacadeService.getTransfers(+account);
  }

  @Get('transfers/user/:uuid')
  @ApiOperation({ summary: 'Get transfer history for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User transfer history retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transfer history.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getTransfersByUUID(@Param('uuid') uuid: string) {
    return await this.starbankFacadeService.getTransfersByUUID(uuid);
  }
}