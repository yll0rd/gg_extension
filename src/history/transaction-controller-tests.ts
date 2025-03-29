// src/token/controllers/transaction.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../services/transaction.service';
import { TransactionSyncService } from '../services/transaction-sync.service';
import { TokenType, TransactionStatus, Network } from '../types/token.types';
import { QueryTransactionsDto } from '../dto/query-transactions.dto';
import { TokenTransactionResponseDto } from '../dto/token-transaction-response.dto';
import { SyncTransactionsDto } from '../dto/sync-transactions.dto';

// Mock data
const mockTransaction = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  fromAddress: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  toAddress: '0x04d0eb9616c5454f1d842d13b5bedbf1c0c9242129ca7437c0e195c00748e30c',
  tokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  tokenType: TokenType.ERC20,
  amount: '1000000000000000000',
  transactionHash: '0x54e35352c9ebc4d9f1e614746d81ef96e11a62e380207137cdd9a0bc71a9f5a',
  status: TransactionStatus.CONFIRMED,
  network: Network.MAINNET,
  blockNumber: 12345678,
  blockTimestamp: new Date('2023-04-15T10:30:00Z'),
  createdAt: new Date('2023-04-15T10:30:00Z'),
  updatedAt: new Date('2023-04-15T10:35:00Z'),
};

const mockTransactionResponse: TokenTransactionResponseDto = { ...mockTransaction };

const mockTransactionsList = {
  items: [mockTransactionResponse, { ...mockTransactionResponse, id: '223e4567-e89b-12d3-a456-426614174001' }],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Mock services
const mockTransactionService = {
  findTransactions: jest.fn().mockResolvedValue(mockTransactionsList),
  findByTransactionHash: jest.fn().mockResolvedValue(mockTransaction),
  mapToResponseDto: jest.fn().mockReturnValue(mockTransactionResponse),
};

const mockSyncService = {
  startSync: jest.fn().mockResolvedValue('sync-job-id-123'),
  getJobStatus: jest.fn().mockResolvedValue({
    status: 'running',
    progress: 50,
    message: 'Syncing transactions',
  }),
};

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;
  let syncService: TransactionSyncService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: TransactionSyncService,
          useValue: mockSyncService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
    syncService = module.get<TransactionSyncService>(TransactionSyncService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      // Setup
      const queryParams: QueryTransactionsDto = {
        page: 1,
        limit: 10,
      };

      // Execute
      const result = await controller.getTransactions(queryParams);

      // Assert
      expect(transactionService.findTransactions).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual({
        items: mockTransactionsList.items,
        metadata: {
          total: mockTransactionsList.total,
          page: mockTransactionsList.page,
          limit: mockTransactionsList.limit,
          totalPages: mockTransactionsList.totalPages,
        },
      });
    });

    it('should handle errors gracefully', async () => {
      // Setup
      const queryParams: QueryTransactionsDto = {
        page: 1,
        limit: 10,
      };
      const errorMessage = 'Database error';
      mockTransactionService.findTransactions.mockRejectedValueOnce(new Error(errorMessage));

      // Execute & Assert
      await expect(controller.getTransactions(queryParams)).rejects.toThrow(HttpException);
      await expect(controller.getTransactions(queryParams)).rejects.toThrow(
        `Failed to retrieve transactions: ${errorMessage}`
      );
    });
  });

  describe('getAddressTransactions', () => {
    it('should return transactions for a specific address', async () => {
      // Setup
      const address = '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3';
      const queryParams: QueryTransactionsDto = {
        page: 1,
        limit: 10,
      };

      // Execute
      const result = await controller.getAddressTransactions(address, queryParams);

      // Assert
      expect(transactionService.findTransactions).toHaveBeenCalledWith({
        ...queryParams,
        address,
      });
      expect(result).toEqual({
        items: mockTransactionsList.items,
        metadata: {
          total: mockTransactionsList.total,
          page: mockTransactionsList.page,
          limit: mockTransactionsList.limit,
          totalPages: mockTransactionsList.totalPages,
        },
      });
    });
  });

  describe('getTokenTransactions', () => {
    it('should return transactions for a specific token', async () => {
      // Setup
      const tokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const queryParams: QueryTransactionsDto = {
        page: 1,
        limit: 10,
      };

      // Execute
      const result = await controller.getTokenTransactions(tokenAddress, queryParams);

      // Assert
      expect(transactionService.findTransactions).toHaveBeenCalledWith({
        ...queryParams,
        tokenAddress,
      });
      expect(result).toEqual({
        items: mockTransactionsList.items,
        metadata: {
          total: mockTransactionsList.total,
          page: mockTransactionsList.page,
          limit: mockTransactionsList.limit,
          totalPages: mockTransactionsList.totalPages,
        },
      });
    });
  });

  describe('getTransactionByHash', () => {
    it('should return a transaction by hash', async () => {
      // Setup
      const txHash = '0x54e35352c9ebc4d9f1e614746d81ef96e11a62e380207137cdd9a0bc71a9f5a';
      mockTransactionService.findByTransactionHash.mockResolvedValueOnce(mockTransaction);

      // Execute
      const result = await controller.getTransactionByHash(txHash);

      // Assert
      expect(transactionService.findByTransactionHash).toHaveBeenCalledWith(txHash);
      expect(transactionService.mapToResponseDto).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual(mockTransactionResponse);
    });

    it('should throw a 404 if transaction not found', async () => {
      // Setup
      const txHash = 'non-existent-hash';
      mockTransactionService.findByTransactionHash.mockResolvedValueOnce(null);

      // Execute & Assert
      await expect(controller.getTransactionByHash(txHash)).rejects.toThrow(HttpException);
      await expect(controller.getTransactionByHash(txHash)).rejects.toThrow(
        `Transaction with hash ${txHash} not found`
      );
    });
  });

  describe('syncTransactions', () => {
    it('should start a sync job', async () => {
      // Setup
      const syncDto: SyncTransactionsDto = {
        address: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
      };
      const jobId = 'sync-job-id-123';
      mockSyncService.startSync.mockResolvedValueOnce(jobId);

      // Execute
      const result = await controller.syncTransactions(syncDto);

      // Assert
      expect(syncService.startSync).toHaveBeenCalledWith(syncDto);
      expect(result).toEqual({
        message: 'Transaction sync initiated successfully',
        jobId,
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should get the status of a sync job', async () => {
      // Setup
      const jobId = 'sync-job-id-123';
      const status = {
        status: 'running',
        progress: 50,
        message: 'Syncing transactions',
      };
      mockSyncService.getJobStatus.mockResolvedValueOnce(status);

      // Execute
      const result = await controller.getSyncStatus(jobId);

      // Assert
      expect(syncService.getJobStatus).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(status);
    });
  });
});
