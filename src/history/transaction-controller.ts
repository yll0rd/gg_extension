// src/token/controllers/transaction.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam, 
  ApiQuery 
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TransactionService } from '../services/transaction.service';
import { TransactionSyncService } from '../services/transaction-sync.service';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import { TokenTransactionResponseDto } from '../dto/token-transaction-response.dto';
import { SyncTransactionsDto } from '../dto/sync-transactions.dto';
import { TokenTransaction } from '../entities/token-transaction.entity';
import { PaginatedResultDto } from '../../common/dto/paginated-result.dto';

@ApiTags('token-transactions')
@Controller('token-transactions')
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly syncService: TransactionSyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get token transaction history with filtering and pagination' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transactions retrieved successfully', 
    type: PaginatedResultDto 
  })
  async getTransactions(
    @Query() queryParams: QueryTransactionsDto,
  ): Promise<PaginatedResultDto<TokenTransactionResponseDto>> {
    try {
      const { items, total, page, limit, totalPages } = 
        await this.transactionService.findTransactions(queryParams);
      
      return {
        items,
        metadata: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving transactions: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('address/:address')
  @ApiOperation({ summary: 'Get transactions for a specific address' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transactions retrieved successfully', 
    type: PaginatedResultDto 
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async getAddressTransactions(
    @Param('address') address: string,
    @Query() queryParams: QueryTransactionsDto,
  ): Promise<PaginatedResultDto<TokenTransactionResponseDto>> {
    try {
      // Merge the address parameter with the query parameters
      const params = {
        ...queryParams,
        address,
      };
      
      const { items, total, page, limit, totalPages } = 
        await this.transactionService.findTransactions(params);
      
      return {
        items,
        metadata: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving address transactions: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve address transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('token/:tokenAddress')
  @ApiOperation({ summary: 'Get transactions for a specific token' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transactions retrieved successfully', 
    type: PaginatedResultDto 
  })
  @ApiParam({ name: 'tokenAddress', description: 'Token contract address' })
  async getTokenTransactions(
    @Param('tokenAddress') tokenAddress: string,
    @Query() queryParams: QueryTransactionsDto,
  ): Promise<PaginatedResultDto<TokenTransactionResponseDto>> {
    try {
      // Merge the token address parameter with the query parameters
      const params = {
        ...queryParams,
        tokenAddress,
      };
      
      const { items, total, page, limit, totalPages } = 
        await this.transactionService.findTransactions(params);
      
      return {
        items,
        metadata: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error retrieving token transactions: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve token transactions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':txHash')
  @ApiOperation({ summary: 'Get transaction details by hash' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction retrieved successfully', 
    type: TokenTransactionResponseDto 
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Transaction not found',
  })
  @ApiParam({ name: 'txHash', description: 'Transaction hash' })
  async getTransactionByHash(
    @Param('txHash') txHash: string,
  ): Promise<TokenTransactionResponseDto> {
    try {
      const transaction = await this.transactionService.findByTransactionHash(txHash);
      
      if (!transaction) {
        throw new HttpException(
          `Transaction with hash ${txHash} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      return this.transactionService.mapToResponseDto(transaction);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Error retrieving transaction by hash: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve transaction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync transactions from blockchain (admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sync initiated successfully' 
  })
  async syncTransactions(
    @Body() syncDto: SyncTransactionsDto,
  ): Promise<{ message: string; jobId: string }> {
    try {
      const jobId = await this.syncService.startSync(syncDto);
      
      return {
        message: 'Transaction sync initiated successfully',
        jobId,
      };
    } catch (error) {
      this.logger.error(`Error initiating transaction sync: ${error.message}`);
      throw new HttpException(
        `Failed to initiate transaction sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('sync/status/:jobId')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get sync job status (admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Sync status retrieved successfully' 
  })
  @ApiParam({ name: 'jobId', description: 'Sync job ID' })
  async getSyncStatus(
    @Param('jobId') jobId: string,
  ): Promise<{ status: string; progress: number; message: string }> {
    try {
      return await this.syncService.getJobStatus(jobId);
    } catch (error) {
      this.logger.error(`Error retrieving sync status: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
