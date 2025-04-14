import { Body, Controller, Get, Param, Post, Query, HttpStatus, Logger } from '@nestjs/common';
import { StarbankService } from './starbank.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { CreateAccountDto } from './dto/create-account-dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money-dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction-dto';
import { CreateTransferDto } from './dto/create-transfer-dto';
import { TransferFromMainDto } from './dto/transfer-from-main-dto';

@ApiTags('smartrotom/starbank')
@Controller('smartrotom/starbank')
export class StarbankController {
  private readonly logger = new Logger(StarbankController.name);

  constructor(
    private readonly starbankService: StarbankService,
    private readonly responseService: ResponseService,
  ) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  async getAllAccounts() {
    const action = 'get all accounts';
    try {
      this.responseService.logRequest(action, null);
      const accounts = await this.starbankService.getAllAccounts();
      this.responseService.logSuccess(action, accounts);
      return this.responseService.createSuccessResponse('Accounts retrieved successfully', accounts);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Account created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create account.' })
  async createAccount(@Body() body: CreateAccountDto) {
    const action = 'create account';
    try {
      this.responseService.logRequest(action, body);
      const account = await this.starbankService.createAccount(body.uuid, body.name);
      this.responseService.logSuccess(action, account);
      return this.responseService.createSuccessResponse('Account created successfully', account);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Get('accounts/:uuid')
  @ApiOperation({ summary: 'Get accounts for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Accounts retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve accounts.' })
  async getAccounts(@Param('uuid') uuid: string) {
    const action = 'get accounts';
    try {
      this.responseService.logRequest(action, { uuid });
      const accounts = await this.starbankService.getAccounts(uuid);
      this.responseService.logSuccess(action, accounts);
      return this.responseService.createSuccessResponse('Accounts retrieved successfully', accounts);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('balance/:uuid')
  @ApiOperation({ summary: 'Get balance for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Balance retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve balance.' })
  async getBalance(@Param('uuid') uuid: string) {
    const action = 'get balance';
    try {
      this.responseService.logRequest(action, { uuid });
      const balance = await this.starbankService.getBalance(uuid);
      this.responseService.logSuccess(action, balance);
      return this.responseService.createSuccessResponse('Balance retrieved successfully', balance);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Post('shop')
  @ApiOperation({ summary: 'Handle shop transaction' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Shop transaction handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle shop transaction.' })
  async shop(@Body() body: CreateShopTransactionDto) {
    const action = 'handle shop transaction';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.starbankService.shop(body);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Shop transaction handled successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Post('trainerdefeat')
  @ApiOperation({ summary: 'Handle trainer defeat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Trainer defeat handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle trainer defeat.' })
  async trainerDefeat(@Body() body: TrainerDefeatMoneyDto) {
    const action = 'handle trainer defeat';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.starbankService.trainerDefeat(body.money, body.uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Trainer defeat handled successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Get('transactions/:account')
  @ApiOperation({ summary: 'Get transactions for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transactions retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transactions.' })
  async getTransactions(@Param('account') account: number, @Query('limit') limit: string) {
    const action = 'get transactions';
    try {
      this.responseService.logRequest(action, { account, limit });
      const transactions = await this.starbankService.getTransactions(account, parseInt(limit));
      this.responseService.logSuccess(action, transactions);
      return this.responseService.createSuccessResponse('Transactions retrieved successfully', transactions);
    } catch (error) {
      this.responseService.handleError(action, error, { account, limit });
    }
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle transfer.' })
  async transfer(@Body() body: CreateTransferDto) {
    const action = 'transfer money';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.starbankService.transfer(body.from, body.to, body.amount, body.concept);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Transfer handled successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Get('transfers/:account')
  @ApiOperation({ summary: 'Get transfers for an account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfers retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve transfers.' })
  async getTransfers(@Param('account') account: number) {
    const action = 'get transfers';
    try {
      this.responseService.logRequest(action, { account });
      const transfers = await this.starbankService.getTransfers(account);
      this.responseService.logSuccess(action, transfers);
      return this.responseService.createSuccessResponse('Transfers retrieved successfully', transfers);
    } catch (error) {
      this.responseService.handleError(action, error, { account });
    }
  }
  
  @Post('transfer/from-main')
  @ApiOperation({ summary: 'Transfer money from user main account' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer handled successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to handle transfer.' })
  async transferFromMain(@Body() body: TransferFromMainDto) {
    const action = 'transfer money from main account';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.starbankService.transferFromMain(body.uuid, body.to, body.amount, body.concept);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Transfer handled successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }
}