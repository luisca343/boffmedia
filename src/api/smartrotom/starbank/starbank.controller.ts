import { Body, Controller, Get, Param, Post, Query, HttpStatus, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { StarbankFacadeService } from './starbank.facade.service';

// Import DTOs
import { CreateAccountDto } from './dto/create-account.dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money.dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferFromMainDto } from './dto/transfer-from-main.dto';

// Import Response DTOs
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { AccountsListResponseDto } from './dto/accounts-list-response.dto';
import { TransactionsListResponseDto } from './dto/transactions-list-response.dto';

// Import Entities
import { StarBankAccount } from './entities/starbank-account.entity';
import { StarBankTransaction } from './entities/starbank-transaction.entity';
import { AccountResponseDto } from './dto/account-response-dto';

@ApiTags('SmartRotom | Starbank')
@Controller('smartrotom/starbank')
@UseInterceptors(ResponseInterceptor)
export class StarbankController {
  constructor(private readonly starbankFacadeService: StarbankFacadeService) {}

  // ==================== ACCOUNT OPERATIONS ====================

  @Get('accounts')
  @ApiOperation({ 
    summary: 'Get all accounts',
    description: 'Retrieve a list of all StarBank accounts in the system' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Accounts retrieved successfully.',
    type: AccountsListResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve accounts.' 
  })
  async getAllAccounts(): Promise<AccountsListResponseDto> {
    return await this.starbankFacadeService.getAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({ 
    summary: 'Create a new account',
    description: 'Create a new StarBank account for a user' 
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Account created successfully.',
    type: AccountResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid account data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to create account.' 
  })
  async createAccount(@Body(ValidationPipe) createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    return await this.starbankFacadeService.createAccount(createAccountDto.uuid, createAccountDto.name);
  }

  @Post('accounts/main')
  @ApiOperation({ 
    summary: 'Create a main account for a user',
    description: 'Create the primary account for a user (only one main account per user allowed)' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        uuid: { type: 'string', format: 'uuid', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' },
        username: { type: 'string', example: 'TrainerAsh' }
      },
      required: ['uuid', 'username']
    }
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Main account created successfully.',
    type: AccountResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid user data or main account already exists.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to create main account.' 
  })
  async createMainAccount(@Body() body: { uuid: string; username: string }): Promise<AccountResponseDto> {
    return await this.starbankFacadeService.createMainAccount(body.uuid, body.username);
  }

  @Get('accounts/:uuid')
  @ApiOperation({ 
    summary: 'Get accounts for a user',
    description: 'Retrieve all accounts belonging to a specific user' 
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Accounts retrieved successfully.',
    type: [StarBankAccount]
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found or no accounts.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve accounts.' 
  })
  async getUserAccounts(@Param('uuid') uuid: string): Promise<StarBankAccount[]> {
    return await this.starbankFacadeService.getAccounts(uuid);
  }

  @Get('balance/:uuid')
  @ApiOperation({ 
    summary: 'Get balance for a user',
    description: 'Retrieve the current balance from the user\'s main account' 
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Balance retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 1500, description: 'Current balance in PokéDollars' }
      }
    }
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve balance.' 
  })
  async getUserBalance(@Param('uuid') uuid: string): Promise<{ balance: number }> {
    return await this.starbankFacadeService.getBalance(uuid);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  @Post('transfer')
  @ApiOperation({ 
    summary: 'Transfer money between accounts',
    description: 'Transfer a specified amount of PokéDollars from one account to another' 
  })
  @ApiBody({ type: CreateTransferDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transfer completed successfully.',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid transfer data or insufficient balance.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to process transfer.' 
  })
  async transfer(@Body(ValidationPipe) transferDto: CreateTransferDto): Promise<TransactionResponseDto> {
    return await this.starbankFacadeService.transfer(
      transferDto.from,
      transferDto.to,
      transferDto.amount,
      transferDto.concept
    );
  }

  @Post('transfer/from-main')
  @ApiOperation({ 
    summary: 'Transfer money from user main account',
    description: 'Transfer money from the user\'s main account to another account' 
  })
  @ApiBody({ type: TransferFromMainDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transfer from main completed successfully.',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid transfer data or insufficient balance.' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Main account not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to process transfer.' 
  })
  async transferFromMain(@Body(ValidationPipe) transferDto: TransferFromMainDto): Promise<TransactionResponseDto> {
    return await this.starbankFacadeService.transferFromMain(
      transferDto.uuid,
      transferDto.to,
      transferDto.amount,
      transferDto.concept
    );
  }

  @Post('shop')
  @ApiOperation({ 
    summary: 'Process shop transaction (buy/sell)',
    description: 'Process a purchase or sale transaction with an NPC shop' 
  })
  @ApiBody({ type: CreateShopTransactionDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Shop transaction processed successfully.',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid transaction data or insufficient balance.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to process shop transaction.' 
  })
  async shopTransaction(@Body(ValidationPipe) shopDto: CreateShopTransactionDto): Promise<TransactionResponseDto> {
    return await this.starbankFacadeService.shop(shopDto);
  }

  @Post('trainerdefeat')
  @ApiOperation({ 
    summary: 'Process trainer defeat reward',
    description: 'Process money reward for defeating an NPC trainer' 
  })
  @ApiBody({ type: TrainerDefeatMoneyDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Trainer defeat reward processed successfully.',
    type: TransactionResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid reward data.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to process trainer defeat reward.' 
  })
  async trainerDefeat(@Body(ValidationPipe) trainerDto: TrainerDefeatMoneyDto): Promise<TransactionResponseDto> {
    return await this.starbankFacadeService.trainerDefeat(trainerDto.money, trainerDto.uuid);
  }

  // ==================== TRANSACTION HISTORY ====================

  @Get('transactions/:account')
  @ApiOperation({ 
    summary: 'Get transaction history for an account',
    description: 'Retrieve the transaction history for a specific account' 
  })
  @ApiParam({ 
    name: 'account', 
    description: 'Account ID',
    type: 'number',
    example: 123
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of transactions to retrieve (max 100)',
    required: false,
    type: 'number',
    example: 50
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction history retrieved successfully.',
    type: [StarBankTransaction]
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Account not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve transaction history.' 
  })
  async getAccountTransactions(
    @Param('account') account: number,
    @Query('limit') limit: number = 50
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransactions(account, limit);
  }

  @Get('transactions/user/:uuid')
  @ApiOperation({ 
    summary: 'Get transaction history for a user',
    description: 'Retrieve the transaction history for all accounts belonging to a user' 
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of transactions to retrieve (max 100)',
    required: false,
    type: 'number',
    example: 50
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User transaction history retrieved successfully.',
    type: TransactionsListResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve transaction history.' 
  })
  async getUserTransactions(
    @Param('uuid') uuid: string,
    @Query('limit') limit: number = 50
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransactionsByUUID(uuid, limit);
  }

  @Get('transfers/:account')
  @ApiOperation({ 
    summary: 'Get transfer history for an account',
    description: 'Retrieve only transfer transactions for a specific account' 
  })
  @ApiParam({ 
    name: 'account', 
    description: 'Account ID',
    type: 'number',
    example: 123
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transfer history retrieved successfully.',
    type: TransactionsListResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Account not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve transfer history.' 
  })
  async getAccountTransfers(@Param('account') account: number): Promise<TransactionsListResponseDto> {
    return await this.starbankFacadeService.getTransfers(account);
  }

  @Get('transfers/user/:uuid')
  @ApiOperation({ 
    summary: 'Get transfer history for a user',
    description: 'Retrieve only transfer transactions for all accounts belonging to a user' 
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User transfer history retrieved successfully.',
    type: TransactionsListResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'User not found.' 
  })
  @ApiResponse({ 
    status: HttpStatus.INTERNAL_SERVER_ERROR, 
    description: 'Failed to retrieve transfer history.' 
  })
  async getUserTransfers(@Param('uuid') uuid: string): Promise<TransactionsListResponseDto> {
    return await this.starbankFacadeService.getTransfersByUUID(uuid);
  }
}