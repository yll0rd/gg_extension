// src/token/dto/token-balance.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TokenBalanceDto {
  @ApiProperty({
    description: 'Token contract address',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH address in Starknet
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User wallet address',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  userAddress: string;

  @ApiProperty({
    description: 'Token balance in base units',
    example: '1000000000000000000', // 1 token with 18 decimals
  })
  balance: string;

  @ApiProperty({
    description: 'Formatted balance with proper decimal places',
    example: '1.0',
  })
  balanceFormatted: string;

  @ApiProperty({
    description: 'Token name',
    example: 'Ethereum',
  })
  tokenName: string;

  @ApiProperty({
    description: 'Token symbol',
    example: 'ETH',
  })
  tokenSymbol: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 18,
  })
  tokenDecimals: number;
}

// src/token/dto/add-watched-token.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AddWatchedTokenDto {
  @ApiProperty({
    description: 'Token contract address to watch',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  })
  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  @ApiPropertyOptional({
    description: 'Mark token as favorite',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;
}

// src/token/dto/historical-balances-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class HistoricalBalancesQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of records to return',
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 30;

  @ApiPropertyOptional({
    description: 'Filter records from this timestamp (ISO string)',
    example: '2023-01-01T00:00:00Z',
  })
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter records until this timestamp (ISO string)',
    example: '2023-12-31T23:59:59Z',
  })
  @IsOptional()
  to?: string;
}

// src/token/dto/batch-balances-query.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class BatchBalancesQueryDto {
  @ApiProperty({
    description: 'Comma-separated list of token addresses',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7,0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  })
  @IsString()
  @IsNotEmpty()
  tokens: string;

  @ApiPropertyOptional({
    description: 'Force refresh from blockchain',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  forceRefresh?: boolean;
}

// src/token/dto/token-balance-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TokenBalanceResponseDto {
  @ApiProperty({
    description: 'Token contract address',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User wallet address',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  userAddress: string;

  @ApiProperty({
    description: 'Token balance in base units',
    example: '1000000000000000000',
  })
  balance: string;

  @ApiProperty({
    description: 'Formatted balance with proper decimal places',
    example: '1.0',
  })
  balanceFormatted: string;

  @ApiProperty({
    description: 'Token name',
    example: 'Ethereum',
  })
  tokenName: string;

  @ApiProperty({
    description: 'Token symbol',
    example: 'ETH',
  })
  tokenSymbol: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 18,
  })
  tokenDecimals: number;

  @ApiPropertyOptional({
    description: 'Whether this token is marked as favorite',
    example: true,
  })
  isFavorite?: boolean;

  @ApiPropertyOptional({
    description: 'When the balance was last updated',
    example: '2023-05-20T15:30:45Z',
  })
  lastUpdated?: Date;

  @ApiPropertyOptional({
    description: 'USD value of the balance (if price data is available)',
    example: 1800.50,
  })
  usdValue?: number;
}
