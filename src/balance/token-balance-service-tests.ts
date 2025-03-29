// src/token/services/token-balance.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenBalanceService } from './token-balance.service';
import { StarknetService } from './starknet.service';
import { CacheService } from '../../common/services/cache.service';
import { TokenRepository } from '../repositories/token.repository';
import { TokenBalanceEntity } from '../entities/token-balance.entity';
import { UserTokenEntity } from '../entities/user-token.entity';
import { Network } from '../types/token.types';
import { ScheduleModule } from '@nestjs/schedule';

// Mock data
const mockUserAddress = '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3';
const mockTokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
const mockBalance = '1000000000000000000'; // 1 ETH in wei
const mockToken = {
  address: mockTokenAddress,
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  network: Network.MAINNET,
  isERC20: true,
  isERC721: false,
  isERC1155: false,
};
const mockBalanceDto = {
  userAddress: mockUserAddress,
  tokenAddress: mockTokenAddress,
  balance: mockBalance,
  balanceFormatted: '1.0',
  tokenName: 'Ethereum',
  tokenSymbol: 'ETH',
  tokenDecimals: 18,
};
const mockUserToken = {
  id: '1',
  userAddress: mockUserAddress,
  tokenAddress: mockTokenAddress,
  tokenName: 'Ethereum',
  tokenSymbol: 'ETH',
  tokenDecimals: 18,
  latestBalance: mockBalance,
  isERC20: true,
  isERC721: false,
  isERC1155: false,
  isFavorite: false,
  network: Network.MAINNET,
  lastUpdated: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mocks
const mockStarknetService = {
  connect: jest.fn(),
  getTokenBalance: jest.fn().mockResolvedValue(mockBalance),
  getTokenInfo: jest.fn().mockResolvedValue(mockToken),
  network: Network.MAINNET,
};

const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  delByPattern: jest.fn(),
};

const mockTokenRepository = {
  findById: jest.fn(),
  findByTransactionHash: jest.fn(),
  createTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  findTransactions: jest.fn(),
};

const mockTokenBalanceRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockUserTokenRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

describe('TokenBalanceService', () => {
  let service: TokenBalanceService;
  let starknetService: StarknetService;
  let cacheService: CacheService;
  let tokenBalanceRepository: Repository<TokenBalanceEntity>;
  let userTokenRepository: Repository<UserTokenEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        TokenBalanceService,
        {
          provide: StarknetService,
          useValue: mockStarknetService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: TokenRepository,
          useValue: mockTokenRepository,
        },
        {
          provide: getRepositoryToken(TokenBalanceEntity),
          useValue: mockTokenBalanceRepository,
        },
        {
          provide: getRepositoryToken(UserTokenEntity),
          useValue: mockUserTokenRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'CACHE_TTL') return 300; // 5 minutes
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TokenBalanceService>(TokenBalanceService);
    starknetService = module.get<StarknetService>(StarknetService);
    cacheService = module.get<CacheService>(CacheService);
    tokenBalanceRepository = module.get<Repository<TokenBalanceEntity>>(
      getRepositoryToken(TokenBalanceEntity),
    );
    userTokenRepository = module.get<Repository<UserTokenEntity>>(
      getRepositoryToken(UserTokenEntity),
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenBalance', () => {
    it('should return cached balance if available', async () => {
      // Setup
      mockCacheService.get.mockResolvedValue(mockBalanceDto);

      // Execute
      const result = await service.getTokenBalance(mockUserAddress, mockTokenAddress);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(
        `token_balance:${mockUserAddress}:${mockTokenAddress}`
      );
      expect(starknetService.getTokenBalance).not.toHaveBeenCalled();
      expect(result).toEqual(mockBalanceDto);
    });

    it('should fetch balance from blockchain if not in cache', async () => {
      // Setup
      mockCacheService.get.mockResolvedValue(null);
      mockStarknetService.getTokenBalance.mockResolvedValue(mockBalance);
      mockUserTokenRepository.findOne.mockResolvedValue(null);
      mockUserTokenRepository.create.mockReturnValue(mockUserToken);
      mockUserTokenRepository.save.mockResolvedValue(mockUserToken);
      mockTokenBalanceRepository.create.mockReturnValue({
        userAddress: mockUserAddress,
        tokenAddress: mockTokenAddress,
        balance: mockBalance,
        blockTimestamp: expect.any(Date),
        userTokenId: mockUserToken.id,
      });
      mockTokenBalanceRepository.save.mockResolvedValue({});

      // Execute
      const result = await service.getTokenBalance(mockUserAddress, mockTokenAddress);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith(
        `token_balance:${mockUserAddress}:${mockTokenAddress}`
      );
      expect(starknetService.getTokenInfo).toHaveBeenCalledWith(mockTokenAddress);
      expect(starknetService.getTokenBalance).toHaveBeenCalledWith(
        mockTokenAddress, 
        mockUserAddress
      );
      expect(cacheService.set).toHaveBeenCalledWith(
        `token_balance:${mockUserAddress}:${mockTokenAddress}`,
        expect.objectContaining({
          tokenAddress: mockTokenAddress,
          userAddress: mockUserAddress,
          balance: mockBalance,
        }),
        expect.any(Number)
      );
      expect(result).toEqual(expect.objectContaining({
        tokenAddress: mockTokenAddress,
        userAddress: mockUserAddress,
        balance: mockBalance,
      }));
    });

    it('should force refresh balance from blockchain when forceRefresh is true', async () => {
      // Setup
      mockStarknetService.getTokenBalance.mockResolvedValue(mockBalance);
      mockUserTokenRepository.findOne.mockResolvedValue(mockUserToken);
      mockTokenBalanceRepository.create.mockReturnValue({
        userAddress: mockUserAddress,
        tokenAddress: mockTokenAddress,
        balance: mockBalance,
        blockTimestamp: expect.any(Date),
        userTokenId: mockUserToken.id,
      });
      mockTokenBalanceRepository.save.mockResolvedValue({});

      // Execute
      const result = await service.getTokenBalance(mockUserAddress, mockTokenAddress, true);

      // Assert
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(starknetService.getTokenBalance).toHaveBeenCalledWith(
        mockTokenAddress, 
        mockUserAddress
      );
      expect(result).toEqual(expect.objectContaining({
        tokenAddress: mockTokenAddress,
        userAddress: mockUserAddress,
        balance: mockBalance,
      }));
    });

    it('should handle blockchain errors gracefully', async () => {
      // Setup
      mockCacheService.get.mockResolvedValue(null);
      mockStarknetService.getTokenBalance.mockRejectedValue(new Error('Blockchain error'));

      // Execute & Assert
      await expect(service.getTokenBalance(mockUserAddress, mockTokenAddress))
        .rejects.toThrow('Failed to get token balance: Blockchain error');
    });
  });

  describe('getMultipleTokenBalances', () => {
    it('should return balances for multiple tokens', async () => {
      // Setup
      const mockToken2Address = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      jest.spyOn(service, 'getTokenBalance')
        .mockResolvedValueOnce({ ...mockBalanceDto })
        .mockResolvedValueOnce({
          ...mockBalanceDto,
          tokenAddress: mockToken2Address,
          tokenSymbol: 'DAI',
          tokenName: 'Dai Stablecoin',
        });

      // Execute
      const result = await service.getMultipleTokenBalances(
        mockUserAddress, 
        [mockTokenAddress, mockToken2Address]
      );

      // Assert
      expect(service.getTokenBalance).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].tokenAddress).toBe(mockTokenAddress);
      expect(result[1].tokenAddress).toBe(mockToken2Address);
    });

    it('should filter out failed balance requests', async () => {
      // Setup
      const mockToken2Address = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';
      jest.spyOn(service, 'getTokenBalance')
        .mockResolvedValueOnce({ ...mockBalanceDto })
        .mockRejectedValueOnce(new Error('Failed to get balance'));

      // Execute
      const result = await service.getMultipleTokenBalances(
        mockUserAddress, 
        [mockTokenAddress, mockToken2Address]
      );

      // Assert
      expect(service.getTokenBalance).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1);
      expect(result[0].tokenAddress).toBe(mockTokenAddress);
    });
  });

  describe('formatTokenBalance', () => {
    it('should format token balance correctly', async () => {
      // Use private method through a public method
      const result = await service.getTokenBalance(mockUserAddress, mockTokenAddress);
      
      // Assert
      expect(result.balanceFormatted).toBe('1.0');
    });
  });

  describe('cache operations', () => {
    it('should clear balance cache for specific token', async () => {
      // Execute
      await service.clearBalanceCache(mockUserAddress, mockTokenAddress);
      
      // Assert
      expect(cacheService.del).toHaveBeenCalledWith(
        `token_balance:${mockUserAddress}:${mockTokenAddress}`
      );
    });

    it('should clear all balance caches', async () => {
      // Execute
      await service.clearAllBalanceCaches();
      
      // Assert
      expect(cacheService.delByPattern).toHaveBeenCalledWith('token_balance:*');
    });
  });

  describe('database operations', () => {
    it('should get historical balances', async () => {
      // Setup
      const mockHistoricalBalances = [
        { id: '1', balance: '1000000000000000000', blockTimestamp: new Date(), createdAt: new Date() },
        { id: '2', balance: '900000000000000000', blockTimestamp: new Date(), createdAt: new Date() },
      ];
      mockTokenBalanceRepository.find.mockResolvedValue(mockHistoricalBalances);

      // Execute
      const result = await service.getHistoricalBalances(mockUserAddress, mockTokenAddress);
      
      // Assert
      expect(tokenBalanceRepository.find).toHaveBeenCalledWith({
        where: {
          userAddress: mockUserAddress,
          tokenAddress: mockTokenAddress,
        },
        order: {
          blockTimestamp: 'DESC',
        },
        take: 30, // Default limit
      });
      expect(result).toEqual(mockHistoricalBalances);
    });

    it('should get user tokens', async () => {
      // Setup
      const mockUserTokens = [mockUserToken];
      mockUserTokenRepository.find.mockResolvedValue(mockUserTokens);

      // Execute
      const result = await service.getUserTokens(mockUserAddress);
      
      // Assert
      expect(userTokenRepository.find).toHaveBeenCalledWith({
        where: {
          userAddress: mockUserAddress,
        },
        order: {
          lastUpdated: 'DESC',
        },
      });
      expect(result).toEqual(mockUserTokens);
    });
  });
});
