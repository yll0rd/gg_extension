// src/token/services/transaction.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, FindOptionsWhere } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TokenTransaction } from '../entities/token-transaction.entity';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import { TokenTransactionResponseDto } from '../dto/token-transaction-response.dto';
import { TokenType, TransactionStatus } from '../types/token.types';
import { StarknetService } from './starknet.service';
import { UserService } from '../../user/services/user.service';
import { TokenBalanceService } from './token-balance.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(TokenTransaction)
    private readonly transactionRepository: Repository<TokenTransaction>,
    private readonly configService: ConfigService,
    private readonly starknetService: StarknetService,
    private readonly userService: UserService,
    private readonly tokenBalanceService: TokenBalanceService,
  ) {}

  /**
   * Find transactions with filtering and pagination
   */
  async findTransactions(
    queryParams: QueryTransactionsDto
  ): Promise<{
    items: TokenTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      address,
      fromAddress,
      toAddress,
      tokenAddress,
      tokenType,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortDirection = 'DESC',
    } = queryParams;

    // Create query builder
    const queryBuilder = this.createQueryBuilder();

    // Apply filters
    if (address) {
      queryBuilder.andWhere(
        '(transaction.fromAddress = :address OR transaction.toAddress = :address)',
        { address }
      );
    }

    if (fromAddress) {
      queryBuilder.andWhere('transaction.fromAddress = :fromAddress', { fromAddress });
    }

    if (toAddress) {
      queryBuilder.andWhere('transaction.toAddress = :toAddress', { toAddress });
    }

    if (tokenAddress) {
      queryBuilder.andWhere('transaction.tokenAddress = :tokenAddress', { tokenAddress });
    }

    if (tokenType) {
      queryBuilder.andWhere('transaction.tokenType = :tokenType', { tokenType });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.createdAt <= :endDate', { endDate });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Apply sorting
    queryBuilder.orderBy(`transaction.${sortBy}`, sortDirection as 'ASC' | 'DESC');

    // Get paginated results
    const [transactions, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Map entities to DTOs
    const items = transactions.map(tx => this.mapToResponseDto(tx));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find transaction by transaction hash
   */
  async findByTransactionHash(txHash: string): Promise<TokenTransaction> {
    return this.transactionRepository.findOne({
      where: { transactionHash: txHash },
    });
  }

  /**
   * Retrieve transaction details from the blockchain and update local record
   */
  async updateTransactionFromBlockchain(txHash: string): Promise<TokenTransaction> {
    try {
      // Get transaction from the database
      const transaction = await this.findByTransactionHash(txHash);
      
      if (!transaction) {
        throw new Error(`Transaction with hash ${txHash} not found`);
      }
      
      // Get transaction details from the blockchain
      const txReceipt = await this.starknetService.getTransaction(txHash);
      
      if (!txReceipt) {
        return transaction; // Transaction not found on blockchain yet
      }
      
      // Update transaction status based on blockchain data
      const status = this.mapBlockchainStatusToTransactionStatus(txReceipt.status);
      
      // Update transaction with blockchain data
      const updatedTransaction = {
        ...transaction,
        status,
        blockNumber: txReceipt.block_number,
        blockTimestamp: txReceipt.block_timestamp ? new Date(txReceipt.block_timestamp * 1000) : null,
        // Add other blockchain data as needed
      };
      
      // Save updated transaction
      const savedTransaction = await this.transactionRepository.save(updatedTransaction);
      
      // If transaction is confirmed, update token balances
      if (status === TransactionStatus.CONFIRMED) {
        // Update sender's balance if it exists
        if (transaction.fromAddress) {
          this.tokenBalanceService.getTokenBalance(
            transaction.fromAddress,
            transaction.tokenAddress,
            true // Force refresh
          ).catch(error => {
            this.logger.error(`Failed to update sender balance: ${error.message}`);
          });
        }
        
        // Update receiver's balance
        this.tokenBalanceService.getTokenBalance(
          transaction.toAddress,
          transaction.tokenAddress,
          true // Force refresh
        ).catch(error => {
          this.logger.error(`Failed to update receiver balance: ${error.message}`);
        });
      }
      
      return savedTransaction;
    } catch (error) {
      this.logger.error(`Error updating transaction from blockchain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map blockchain transaction status to our internal status
   */
  private mapBlockchainStatusToTransactionStatus(blockchainStatus: string): TransactionStatus {
    switch (blockchainStatus?.toLowerCase()) {
      case 'accepted_on_l2':
      case 'accepted_on_l1':
      case 'succeeded':
        return TransactionStatus.CONFIRMED;
      case 'rejected':
        return TransactionStatus.FAILED;
      case 'reverted':
        return TransactionStatus.REVERTED;
      default:
        return TransactionStatus.PENDING;
    }
  }

  /**
   * Create a new transaction record
   */
  async createTransaction(transactionData: Partial<TokenTransaction>): Promise<TokenTransaction> {
    const transaction = this.transactionRepository.create(transactionData);
    return this.transactionRepository.save(transaction);
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    id: string,
    transactionData: Partial<TokenTransaction>
  ): Promise<TokenTransaction> {
    await this.transactionRepository.update(id, transactionData);
    return this.transactionRepository.findOne({ where: { id } });
  }

  /**
   * Map entity to response DTO
   */
  mapToResponseDto(transaction: TokenTransaction): TokenTransactionResponseDto {
    return {
      id: transaction.id,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      tokenAddress: transaction.tokenAddress,
      tokenType: transaction.tokenType,
      amount: transaction.amount,
      tokenId: transaction.tokenId,
      transactionHash: transaction.transactionHash,
      status: transaction.status,
      network: transaction.network,
      blockNumber: transaction.blockNumber,
      blockTimestamp: transaction.blockTimestamp,
      gasPrice: transaction.gasPrice,
      gasUsed: transaction.gasUsed,
      feePaid: transaction.feePaid,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Create a query builder for transactions
   */
  private createQueryBuilder(): SelectQueryBuilder<TokenTransaction> {
    return this.transactionRepository
      .createQueryBuilder('transaction');
  }

  /**
   * Get pending transactions that need updating
   */
  async getPendingTransactions(): Promise<TokenTransaction[]> {
    return this.transactionRepository.find({
      where: { status: TransactionStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get transactions by user address (either as sender or receiver)
   */
  async getTransactionsByUserAddress(
    userAddress: string,
    limit = 10,
    offset = 0
  ): Promise<[TokenTransaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: [
        { fromAddress: userAddress },
        { toAddress: userAddress },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get transactions for a specific token
   */
  async getTransactionsByToken(
    tokenAddress: string,
    limit = 10,
    offset = 0
  ): Promise<[TokenTransaction[], number]> {
    return this.transactionRepository.findAndCount({
      where: { tokenAddress },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
