// src/token/dto/query-transactions.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDate, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TokenType, TransactionStatus, Network } from '../types/token.types';

export class QueryTransactionsDto {
  @ApiPropertyOptional({
    description: 'Filter by address (sender or receiver)',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Filter by sender address',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  @IsString()
  @IsOptional()
  fromAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by receiver address',
    example: '0x04d0eb9616c5454f1d842d13b5bedbf1c0c9242129ca7437c0e195c00748e30c',
  })
  @IsString()
  @IsOptional()
  toAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by token address',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  })
  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by token type',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  @IsEnum(TokenType)
  @IsOptional()
  tokenType?: TokenType;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by network',
    enum: Network,
    example: Network.MAINNET,
  })
  @IsEnum(Network)
  @IsOptional()
  network?: Network;

  @ApiPropertyOptional({
    description: 'Filter by start date',
    example: '2023-04-01T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by end date',
    example: '2023-04-30T23:59:59Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    default: 'DESC',
    example: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortDirection?: 'ASC' | 'DESC' = 'DESC';
}

// src/token/dto/token-transaction-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenType, TransactionStatus, Network } from '../types/token.types';

export class TokenTransactionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Sender address',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  fromAddress: string;

  @ApiProperty({
    description: 'Receiver address',
    example: '0x04d0eb9616c5454f1d842d13b5bedbf1c0c9242129ca7437c0e195c00748e30c',
  })
  toAddress: string;

  @ApiProperty({
    description: 'Token address',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Token type',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  tokenType: TokenType;

  @ApiProperty({
    description: 'Amount of tokens transferred',
    example: '1000000000000000000', // 1 token with 18 decimals
  })
  amount: string;

  @ApiPropertyOptional({
    description: 'Token ID for NFTs',
    example: '42',
  })
  tokenId?: string;

  @ApiPropertyOptional({
    description: 'Transaction hash',
    example: '0x54e35352c9ebc4d9f1e614746d81ef96e11a62e380207137cdd9a0bc71a9f5a',
  })
  transactionHash?: string;

  @ApiProperty({
    description: 'Transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Blockchain network',
    enum: Network,
    example: Network.MAINNET,
  })
  network: Network;

  @ApiPropertyOptional({
    description: 'Block number where transaction was confirmed',
    example: 12345678,
  })
  blockNumber?: number;

  @ApiPropertyOptional({
    description: 'Block timestamp when transaction was confirmed',
    example: '2023-04-15T10:30:00Z',
  })
  blockTimestamp?: Date;

  @ApiPropertyOptional({
    description: 'Gas price in wei',
    example: '50000000000',
  })
  gasPrice?: string;

  @ApiPropertyOptional({
    description: 'Gas used by the transaction',
    example: '21000',
  })
  gasUsed?: string;

  @ApiPropertyOptional({
    description: 'Transaction fee paid',
    example: '0.00105',
  })
  feePaid?: string;

  @ApiProperty({
    description: 'Transaction record creation date',
    example: '2023-04-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Transaction record last update date',
    example: '2023-04-15T10:35:00Z',
  })
  updatedAt: Date;
}

// src/token/dto/sync-transactions.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncTransactionsDto {
  @ApiPropertyOptional({
    description: 'Address to sync transactions for',
    example: '0x04a9e147455c8dafae167baaae0f2ef6ed8f6792847fcaa9a8a841a8c03bbee3',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Token address to sync transactions for',
    example: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  })
  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Starting block number for sync',
    example: 100000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  fromBlock?: number;

  @ApiPropertyOptional({
    description: 'Ending block number for sync (defaults to latest)',
    example: 200000,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  toBlock?: number;
}

// src/common/dto/paginated-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetadataDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

export class PaginatedResultDto<T> {
  @ApiProperty({
    description: 'List of items',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetadataDto,
  })
  metadata: PaginationMetadataDto;
}
