// src/token/controllers/token-balance.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
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
import { TokenBalanceService } from '../services/token-balance.service';
import { TokenBalanceDto } from '../dto/token-balance.dto';
import { UserTokenEntity } from '../entities/user-token.entity';
import { TokenBalanceEntity } from '../entities/token-balance.entity';
import { AddWatchedTokenDto } from '../dto/add-watched-token.dto';

@ApiTags('token-balances')
@Controller('token-balances')
export class TokenBalanceController {
  private readonly logger = new Logger(TokenBalanceController.name);

  constructor(private readonly tokenBalanceService: TokenBalanceService) {}

  @Get(':address/balance/:tokenAddress')
  @ApiOperation({ summary: 'Get token balance for an address' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token balance retrieved successfully', 
    type: TokenBalanceDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid address or token address' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Blockchain service unavailable' 
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiParam({ name: 'tokenAddress', description: 'Token contract address' })
  @ApiQuery({ 
    name: 'forceRefresh', 
    required: false, 
    type: Boolean, 
    description: 'Force refresh from blockchain' 
  })
  async getBalance(
    @Param('address') address: string,
    @Param('tokenAddress') tokenAddress: string,
    @Query('forceRefresh') forceRefresh?: boolean,
  ): Promise<TokenBalanceDto> {
    try {
      return await this.tokenBalanceService.getTokenBalance(
        address,
        tokenAddress,
        forceRefresh === true
      );
    } catch (error) {
      this.logger.error(`Error fetching balance: ${error.message}`);
      throw new HttpException(
        `Failed to get token balance: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get(':address/balances')
  @ApiOperation({ summary: 'Get all token balances for an address' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token balances retrieved successfully', 
    type: [UserTokenEntity] 
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async getAllBalances(
    @Param('address') address: string,
  ): Promise<UserTokenEntity[]> {
    try {
      return await this.tokenBalanceService.getUserTokens(address);
    } catch (error) {
      this.logger.error(`Error fetching all balances: ${error.message}`);
      throw new HttpException(
        `Failed to get user tokens: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get(':address/balances/batch')
  @ApiOperation({ summary: 'Get multiple token balances at once' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token balances retrieved successfully', 
    type: [TokenBalanceDto] 
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiQuery({ 
    name: 'tokens', 
    required: true, 
    type: String, 
    isArray: true,
    description: 'Comma-separated list of token addresses' 
  })
  async getBatchBalances(
    @Param('address') address: string,
    @Query('tokens') tokensQuery: string,
  ): Promise<TokenBalanceDto[]> {
    try {
      const tokens = tokensQuery.split(',');
      if (!tokens.length) {
        throw new HttpException('No token addresses provided', HttpStatus.BAD_REQUEST);
      }
      
      return await this.tokenBalanceService.getMultipleTokenBalances(address, tokens);
    } catch (error) {
      this.logger.error(`Error fetching batch balances: ${error.message}`);
      throw new HttpException(
        `Failed to get batch token balances: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get(':address/history/:tokenAddress')
  @ApiOperation({ summary: 'Get historical balances for a token' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Historical balances retrieved successfully',
    type: [TokenBalanceEntity]
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  @ApiParam({ name: 'tokenAddress', description: 'Token contract address' })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Maximum number of records to return' 
  })
  async getHistoricalBalances(
    @Param('address') address: string,
    @Param('tokenAddress') tokenAddress: string,
    @Query('limit') limit?: number,
  ): Promise<TokenBalanceEntity[]> {
    try {
      return await this.tokenBalanceService.getHistoricalBalances(
        address,
        tokenAddress,
        limit
      );
    } catch (error) {
      this.logger.error(`Error fetching historical balances: ${error.message}`);
      throw new HttpException(
        `Failed to get historical balances: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Post(':address/watch')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a token to watch for an address' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Token added to watch list', 
    type: UserTokenEntity 
  })
  @ApiParam({ name: 'address', description: 'Wallet address' })
  async addWatchedToken(
    @Param('address') address: string,
    @Body() dto: AddWatchedTokenDto,
  ): Promise<TokenBalanceDto> {
    try {
      // Get token balance which will also add it to the watch list
      return await this.tokenBalanceService.getTokenBalance(
        address,
        dto.tokenAddress,
        true // Force refresh
      );
    } catch (error) {
      this.logger.error(`Error adding watched token: ${error.message}`);
      throw new HttpException(
        `Failed to add watched token: ${error.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Post('refresh-all')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger a refresh of all balances (admin only)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Balance refresh job triggered' 
  })
  async refreshAllBalances(): Promise<{ message: string }> {
    try {
      // Clear all caches
      await this.tokenBalanceService.clearAllBalanceCaches();
      
      // Start the background job
      this.tokenBalanceService.updateTokenBalances().catch(error => {
        this.logger.error(`Error in manual balance refresh: ${error.message}`);
      });
      
      return { message: 'Balance refresh job started' };
    } catch (error) {
      this.logger.error(`Error triggering balance refresh: ${error.message}`);
      throw new HttpException(
        `Failed to trigger balance refresh: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
