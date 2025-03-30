// src/token/services/token-balance.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StarknetService } from './starknet.service';
import { TokenBalanceEntity } from '../entities/token-balance.entity';
import { UserTokenEntity } from '../entities/user-token.entity';
import { TokenBalanceDto } from '../dto/token-balance.dto';
import { ITokenBalance } from '../interfaces/token-balance.interface';
import { IToken } from '../interfaces/token.interface';
import { CacheService } from '../../common/services/cache.service';
import { TokenRepository } from '../repositories/token.repository';
import { Network } from '../types/token.types';
import * as starknet from 'starknet';
import {
  ExponentialBackoff,
  handleRetry,
} from '../../common/utils/retry.utils';

@Injectable()
export class TokenBalanceService implements OnModuleInit {
  private readonly logger = new Logger(TokenBalanceService.name);
  private readonly CACHE_TTL = 5 * 60; // 5 minutes
  private readonly CACHE_PREFIX = 'token_balance:';
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 50; // Number of balances to update in one batch

  constructor(
    private readonly starknetService: StarknetService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly tokenRepository: TokenRepository,
    @InjectRepository(TokenBalanceEntity)
    private readonly tokenBalanceRepository: Repository<TokenBalanceEntity>,
    @InjectRepository(UserTokenEntity)
    private readonly userTokenRepository: Repository<UserTokenEntity>,
  ) {}

  /**
   * Initialize the service and connect to Starknet
   */
  async onModuleInit() {
    try {
      await this.starknetService.connect();
      this.logger.log('TokenBalanceService initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize TokenBalanceService: ${error.message}`,
      );
    }
  }

  /**
   * Get token balance for a user
   * First tries cache, then blockchain if not available
   */
  async getTokenBalance(
    userAddress: string,
    tokenAddress: string,
    forceRefresh = false,
  ): Promise<TokenBalanceDto> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${userAddress}:${tokenAddress}`;

      // Return from cache if available and not forcing a refresh
      if (!forceRefresh) {
        const cachedBalance =
          await this.cacheService.get<TokenBalanceDto>(cacheKey);
        if (cachedBalance) {
          this.logger.debug(
            `Returning cached balance for ${userAddress} / ${tokenAddress}`,
          );
          return cachedBalance;
        }
      }

      // Fetch balance from blockchain
      this.logger.debug(
        `Fetching balance from blockchain for ${userAddress} / ${tokenAddress}`,
      );

      // Get token info first (to determine proper balance format and token type)
      const token = await this.getTokenInfo(tokenAddress);

      // Fetch balance with retry mechanism
      const balance = await handleRetry(
        () => this.starknetService.getTokenBalance(tokenAddress, userAddress),
        this.MAX_RETRIES,
        new ExponentialBackoff(1000, 2, 10000),
      );

      // Format balance based on token decimals
      const balanceFormatted = this.formatTokenBalance(balance, token.decimals);

      // Create response
      const balanceDto: TokenBalanceDto = {
        tokenAddress,
        userAddress,
        balance,
        balanceFormatted,
        tokenName: token.name,
        tokenSymbol: token.symbol,
        tokenDecimals: token.decimals,
      };

      // Save to cache
      await this.cacheService.set(cacheKey, balanceDto, this.CACHE_TTL);

      // Save to database (async, don't wait for it)
      this.saveBalanceToDatabase(
        userAddress,
        tokenAddress,
        balance,
        token,
      ).catch((err) => {
        this.logger.error(`Failed to save balance to database: ${err.message}`);
      });

      return balanceDto;
    } catch (error) {
      this.logger.error(
        `Error getting token balance: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Get balances for multiple tokens at once
   */
  async getMultipleTokenBalances(
    userAddress: string,
    tokenAddresses: string[],
  ): Promise<TokenBalanceDto[]> {
    const promises = tokenAddresses.map((tokenAddress) =>
      this.getTokenBalance(userAddress, tokenAddress).catch((error) => {
        this.logger.error(
          `Error getting balance for ${tokenAddress}: ${error.message}`,
        );
        return null;
      }),
    );

    const results = await Promise.all(promises);
    return results.filter(Boolean); // Filter out failed requests
  }

  /**
   * Get token info (name, symbol, decimals)
   */
  private async getTokenInfo(tokenAddress: string): Promise<IToken> {
    try {
      // Check cache first
      const cacheKey = `token_info:${tokenAddress}`;
      const cachedInfo = await this.cacheService.get<IToken>(cacheKey);

      if (cachedInfo) {
        return cachedInfo;
      }

      // Fetch from blockchain
      const tokenInfo = await this.starknetService.getTokenInfo(tokenAddress);

      // Cache for longer period (token info rarely changes)
      await this.cacheService.set(cacheKey, tokenInfo, 24 * 60 * 60); // 24 hours

      return tokenInfo;
    } catch (error) {
      // Return a default token info if failed to fetch
      this.logger.warn(
        `Failed to get token info for ${tokenAddress}: ${error.message}`,
      );
      return {
        address: tokenAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        network: this.starknetService.network,
        isERC20: true,
        isERC721: false,
        isERC1155: false,
      };
    }
  }

  /**
   * Format token balance with proper decimal places
   */
  private formatTokenBalance(balance: string, decimals: number): string {
    try {
      if (!balance) return '0';

      const balanceBN = BigInt(balance);
      const divisor = BigInt(10) ** BigInt(decimals);

      const wholePart = balanceBN / divisor;
      const fractionalPart = balanceBN % divisor;

      // Convert fractional part to string with leading zeros
      let fractionalStr = fractionalPart.toString();
      fractionalStr = fractionalStr.padStart(decimals, '0');

      // Remove trailing zeros
      fractionalStr = fractionalStr.replace(/0+$/, '');

      if (fractionalStr === '') {
        return wholePart.toString();
      }

      return `${wholePart}.${fractionalStr}`;
    } catch (error) {
      this.logger.error(`Error formatting balance: ${error.message}`);
      return balance;
    }
  }

  /**
   * Save token balance to database
   */
  private async saveBalanceToDatabase(
    userAddress: string,
    tokenAddress: string,
    balance: string,
    token: IToken,
  ): Promise<void> {
    try {
      // Get or create user token entry
      let userToken = await this.userTokenRepository.findOne({
        where: {
          userAddress,
          tokenAddress,
        },
      });

      if (!userToken) {
        userToken = this.userTokenRepository.create({
          userAddress,
          tokenAddress,
          tokenName: token.name,
          tokenSymbol: token.symbol,
          tokenDecimals: token.decimals,
          isERC20: token.isERC20,
          isERC721: token.isERC721,
          network: token.network as Network,
          lastUpdated: new Date(),
        });

        await this.userTokenRepository.save(userToken);
      }

      // Create a new balance entry
      const tokenBalance = this.tokenBalanceRepository.create({
        userAddress,
        tokenAddress,
        balance,
        blockTimestamp: new Date(),
        userTokenId: userToken.id,
      });

      await this.tokenBalanceRepository.save(tokenBalance);

      // Update latest balance in user token
      await this.userTokenRepository.update(userToken.id, {
        latestBalance: balance,
        lastUpdated: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to save balance to database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get historical balances for a token
   */
  async getHistoricalBalances(
    userAddress: string,
    tokenAddress: string,
    limit = 30,
  ): Promise<TokenBalanceEntity[]> {
    return this.tokenBalanceRepository.find({
      where: {
        userAddress,
        tokenAddress,
      },
      order: {
        blockTimestamp: 'DESC',
      },
      take: limit,
    });
  }

  /**
   * Get all tokens owned by a user
   */
  async getUserTokens(userAddress: string): Promise<UserTokenEntity[]> {
    return this.userTokenRepository.find({
      where: {
        userAddress,
      },
      order: {
        lastUpdated: 'DESC',
      },
    });
  }

  /**
   * Clear cache for a specific balance
   */
  async clearBalanceCache(
    userAddress: string,
    tokenAddress: string,
  ): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${userAddress}:${tokenAddress}`;
    await this.cacheService.del(cacheKey);
  }

  /**
   * Clear all balance caches
   */
  async clearAllBalanceCaches(): Promise<void> {
    await this.cacheService.delByPattern(`${this.CACHE_PREFIX}*`);
  }

  /**
   * Scheduled job to update token balances
   * Runs every hour by default
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateTokenBalances() {
    try {
      this.logger.log('Starting scheduled token balance update');

      // Get tokens that need updating (oldest first)
      const tokensToUpdate = await this.userTokenRepository.find({
        order: {
          lastUpdated: 'ASC',
        },
        take: this.BATCH_SIZE,
      });

      if (tokensToUpdate.length === 0) {
        this.logger.log('No tokens to update');
        return;
      }

      this.logger.log(`Updating balances for ${tokensToUpdate.length} tokens`);

      // Process in smaller chunks to avoid rate limiting
      const chunks = this.chunkArray(tokensToUpdate, 10);

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (userToken) => {
            try {
              await this.getTokenBalance(
                userToken.userAddress,
                userToken.tokenAddress,
                true, // Force refresh
              );
            } catch (error) {
              this.logger.error(
                `Failed to update balance for ${userToken.userAddress}/${userToken.tokenAddress}: ${error.message}`,
              );
            }
          }),
        );

        // Wait a bit between chunks to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      this.logger.log('Scheduled token balance update completed');
    } catch (error) {
      this.logger.error(
        `Error in scheduled token balance update: ${error.message}`,
      );
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
