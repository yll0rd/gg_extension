// src/token/dto/create-token-transaction.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { TokenType, Network } from '../types/token.types';

export class CreateTokenTransactionDto {
  @ApiProperty({
    description: 'Wallet address of the sender',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @ApiProperty({
    description: 'Wallet address of the recipient',
    example: '0x0987654321098765432109876543210987654321',
  })
  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @ApiProperty({
    description: 'Token contract address',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
  })
  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  @ApiProperty({
    description: 'Amount of tokens to transfer (in base units)',
    example: '1000000000000000000', // 1 token with 18 decimals
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiPropertyOptional({
    description: 'Token ID for ERC721 or ERC1155 tokens',
    example: '42',
  })
  @IsString()
  @IsOptional()
  tokenId?: string;

  @ApiProperty({
    description: 'Type of token',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  @IsEnum(TokenType)
  tokenType: TokenType;

  @ApiPropertyOptional({
    description: 'Network to use',
    enum: Network,
    default: Network.MAINNET,
    example: Network.TESTNET,
  })
  @IsEnum(Network)
  @IsOptional()
  network?: Network;

  @ApiPropertyOptional({
    description: 'Max fee to pay for the transaction (in wei)',
    example: '10000000000000000', // 0.01 ETH
  })
  @IsString()
  @IsOptional()
  maxFee?: string;

  @ApiPropertyOptional({
    description: 'Whether to wait for transaction confirmation',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  waitForConfirmation?: boolean;
}

// src/token/dto/token-balance.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TokenBalanceDto {
  @ApiProperty({
    description: 'Token contract address',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'User wallet address',
    example: '0x1234567890123456789012345678901234567890',
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
    example: 'Example Token',
  })
  tokenName: string;

  @ApiProperty({
    description: 'Token symbol',
    example: 'EXT',
  })
  tokenSymbol: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 18,
  })
  tokenDecimals: number;
}

// src/token/dto/token-transaction-result.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../types/token.types';

export class TokenTransactionResultDto {
  @ApiProperty({
    description: 'Unique identifier for the transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Whether the transaction was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Transaction hash',
    example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  transactionHash: string;

  @ApiProperty({
    description: 'Status of the transaction',
    enum: TransactionStatus,
    example: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'From address',
    example: '0x1234567890123456789012345678901234567890',
  })
  fromAddress: string;

  @ApiProperty({
    description: 'To address',
    example: '0x0987654321098765432109876543210987654321',
  })
  toAddress: string;

  @ApiProperty({
    description: 'Token address',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Amount transferred',
    example: '1000000000000000000',
  })
  amount: string;

  @ApiPropertyOptional({
    description: 'Token ID for ERC721 or ERC1155',
    example: '42',
  })
  tokenId?: string;

  @ApiPropertyOptional({
    description: 'Block number where the transaction was included',
    example: 12345678,
  })
  blockNumber?: number;

  @ApiPropertyOptional({
    description: 'Error message if failed',
    example: 'Insufficient funds',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'Timestamp when the transaction was created',
    example: '2023-04-15T10:30:00Z',
  })
  createdAt: Date;
}

// src/token/dto/query-transactions.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDate, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TokenType, TransactionStatus, Network } from '../types/token.types';

export class QueryTransactionsDto {
  @ApiPropertyOptional({
    description: 'Filter by sender address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsOptional()
  fromAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by recipient address',
    example: '0x0987654321098765432109876543210987654321',
  })
  @IsString()
  @IsOptional()
  toAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by token address',
    example: '0xabcdef1234567890abcdef1234567890abcdef12',
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
    description: 'Items per page',
    default: 10,
    example: 20,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    example: 2,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;
}
