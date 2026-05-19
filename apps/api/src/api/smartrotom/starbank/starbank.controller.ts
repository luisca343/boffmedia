import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpStatus,
  UseInterceptors,
  ValidationPipe,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { StarbankFacadeService } from './starbank.facade.service';

// Import DTOs
import { CreateMainAccountDto } from './dto/create-main-account.dto';
import { TrainerDefeatMoneyDto } from './dto/trainer-defeat-money.dto';
import { CreateShopTransactionDto } from './dto/create-shop-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { TransferFromMainDto } from './dto/transfer-from-main.dto';

// Import Entities
import { StarBankAccount } from './entities/starbank-account.entity';
import { StarBankTransaction } from './entities/starbank-transaction.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';

@ApiTags('SmartRotom | Starbank')
@Controller('smartrotom/starbank')
@UseInterceptors(ResponseInterceptor)
export class StarbankController {
  constructor(
    private readonly logger: Logger,
    private readonly starbankFacadeService: StarbankFacadeService,
  ) {}

  // ==================== ACCOUNT OPERATIONS ====================

  @Get('accounts')
  @ApiOperation({
    summary: 'Get all accounts',
    description: 'Retrieve a list of all StarBank accounts in the system',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accounts retrieved successfully.',
    type: [StarBankAccount],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve accounts.',
  })
  async getAllAccounts(): Promise<StarBankAccount[]> {
    return await this.starbankFacadeService.getAllAccounts();
  }

  @Post('accounts')
  @ApiOperation({
    summary: 'Create a new account',
    description:
      'Create a new StarBank account for a user with optional profile image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          format: 'uuid',
          example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
          description: 'User UUID',
        },
        name: {
          type: 'string',
          example: 'TrainerAsh',
          description: 'Account name',
        },
        server: {
          type: 'string',
          example: 'your-mc-world-id',
          description: 'Minecraft world/server ID',
        },
        image: {
          type: 'string',
          format: 'binary',
          description:
            'Optional profile image file (jpg, jpeg, png, gif, webp)',
        },
      },
      required: ['uuid', 'name', 'server'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully.',
    type: StarBankAccount,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid account data or unsupported image format.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create account.',
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'public/smartrotom/img/apps/starbank/cuentas');
        },
        filename: (req, file, cb) => {
          const name = req.body.name || 'profile';
          const ext = file.originalname.substring(
            file.originalname.lastIndexOf('.'),
          );
          cb(null, name + ext);
        },
      }),
    }),
  )
  async createAccount(
    @Body('uuid') uuid: string,
    @Body('name') name: string,
    @Body('server') server: string,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<StarBankAccount> {
    const mcWorld = env.MC_WORLD;
    if (server !== mcWorld) {
      throw new Error('You are not authorized to access this route.');
    }

    let imagePath: string | undefined;
    if (image) {
      // Remove 'public\\' from the start of the path and convert backslashes to forward slashes
      const relativePath = image.path
        .replace(/^public[\\/]/, '')
        .replace(/\\/g, '/');
      imagePath = `/${relativePath}`;
      this.logger.log('Image saved:', {
        filename: image.filename,
        originalPath: image.path,
        relativePath: imagePath,
        size: image.size,
        mimetype: image.mimetype,
      });
    }

    return await this.starbankFacadeService.createAccount(
      uuid,
      name,
      imagePath,
    );
  }
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        uuid: {
          type: 'string',
          format: 'uuid',
          example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
        },
        username: { type: 'string', example: 'TrainerAsh' },
      },
      required: ['uuid', 'username'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Main account created successfully.',
    type: StarBankAccount,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user data or main account already exists.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to create main account.',
  })
  async createMainAccount(
    @Body() body: CreateMainAccountDto,
  ): Promise<StarBankAccount> {
    return await this.starbankFacadeService.createMainAccount(
      body.uuid,
      body.username,
    );
  }

  @Get('accounts/:uuid')
  @ApiOperation({
    summary: 'Get accounts for a user',
    description: 'Retrieve all accounts belonging to a specific user',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Accounts retrieved successfully.',
    type: [StarBankAccount],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found or no accounts.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve accounts.',
  })
  async getUserAccounts(
    @Param('uuid') uuid: string,
  ): Promise<StarBankAccount[]> {
    return await this.starbankFacadeService.getAccounts(uuid);
  }

  @Get('balance/:uuid')
  @ApiOperation({
    summary: 'Get balance for a user',
    description: "Retrieve the current balance from the user's main account",
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Balance retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        balance: {
          type: 'number',
          example: 1500,
          description: 'Current balance in PokéDollars',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve balance.',
  })
  async getUserBalance(
    @Param('uuid') uuid: string,
  ): Promise<{ balance: number }> {
    return await this.starbankFacadeService.getBalance(uuid);
  }

  // ==================== TRANSACTION OPERATIONS ====================

  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer money between accounts',
    description:
      'Transfer a specified amount of PokéDollars from one account to another',
  })
  @ApiBody({ type: CreateTransferDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer completed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transfer data or insufficient balance.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process transfer.',
  })
  async transfer(
    @Body(ValidationPipe) transferDto: CreateTransferDto,
  ): Promise<void> {
    return await this.starbankFacadeService.transfer(
      transferDto.from,
      transferDto.to,
      transferDto.amount,
      transferDto.concept,
    );
  }

  @Post('transfer/from-main')
  @ApiOperation({
    summary: 'Transfer money from user main account',
    description:
      "Transfer money from the user's main account to another account",
  })
  @ApiBody({ type: TransferFromMainDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer from main completed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transfer data or insufficient balance.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Main account not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process transfer.',
  })
  async transferFromMain(
    @Body(ValidationPipe) transferDto: TransferFromMainDto,
  ): Promise<void> {
    return await this.starbankFacadeService.transferFromMain(
      transferDto.uuid,
      transferDto.to,
      transferDto.amount,
      transferDto.concept,
    );
  }

  @Post('shop')
  @ApiOperation({
    summary: 'Process shop transaction (buy/sell)',
    description: 'Process a purchase or sale transaction with an NPC shop',
  })
  @ApiBody({ type: CreateShopTransactionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shop transaction processed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid transaction data or insufficient balance.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process shop transaction.',
  })
  async shopTransaction(
    @Body(ValidationPipe) shopDto: CreateShopTransactionDto,
  ): Promise<void> {
    return await this.starbankFacadeService.shop(shopDto);
  }

  @Post('trainerdefeat')
  @ApiOperation({
    summary: 'Process trainer defeat reward',
    description: 'Process money reward for defeating an NPC trainer',
  })
  @ApiBody({ type: TrainerDefeatMoneyDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainer defeat reward processed successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid reward data.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to process trainer defeat reward.',
  })
  async trainerDefeat(
    @Body(ValidationPipe) trainerDto: TrainerDefeatMoneyDto,
  ): Promise<void> {
    return await this.starbankFacadeService.trainerDefeat(
      trainerDto.money,
      trainerDto.uuid,
    );
  }

  // ==================== TRANSACTION HISTORY ====================

  @Get('transactions/:account')
  @ApiOperation({
    summary: 'Get transaction history for an account',
    description: 'Retrieve the transaction history for a specific account',
  })
  @ApiParam({
    name: 'account',
    description: 'Account ID',
    type: 'number',
    example: 123,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of transactions to retrieve (max 100)',
    required: false,
    type: 'number',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction history retrieved successfully.',
    type: [StarBankTransaction],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve transaction history.',
  })
  async getAccountTransactions(
    @Param('account') account: number,
    @Query('limit') limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransactions(account, limit);
  }

  @Get('transactions/user/:uuid')
  @ApiOperation({
    summary: 'Get transaction history for a user',
    description:
      'Retrieve the transaction history for all accounts belonging to a user',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of transactions to retrieve (max 100)',
    required: false,
    type: 'number',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User transaction history retrieved successfully.',
    type: [StarBankTransaction],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve transaction history.',
  })
  async getUserTransactions(
    @Param('uuid') uuid: string,
    @Query('limit') limit: number = 50,
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransactionsByUUID(uuid, limit);
  }

  @Get('transfers/:account')
  @ApiOperation({
    summary: 'Get transfer history for an account',
    description: 'Retrieve only transfer transactions for a specific account',
  })
  @ApiParam({
    name: 'account',
    description: 'Account ID',
    type: 'number',
    example: 123,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transfer history retrieved successfully.',
    type: [StarBankTransaction],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Account not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve transfer history.',
  })
  async getAccountTransfers(
    @Param('account') account: number,
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransfers(account);
  }

  @Get('transfers/user/:uuid')
  @ApiOperation({
    summary: 'Get transfer history for a user',
    description:
      'Retrieve only transfer transactions for all accounts belonging to a user',
  })
  @ApiParam({
    name: 'uuid',
    description: 'User UUID',
    type: 'string',
    format: 'uuid',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User transfer history retrieved successfully.',
    type: [StarBankTransaction],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve transfer history.',
  })
  async getUserTransfers(
    @Param('uuid') uuid: string,
  ): Promise<StarBankTransaction[]> {
    return await this.starbankFacadeService.getTransfersByUUID(uuid);
  }
}
