// src/token-transactions/dto/create-token-transaction.dto.ts
import { IsEnum, IsUUID, IsOptional, IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenType } from '../enums/token-type.enum';

export class CreateTokenTransactionDto {
  @ApiPropertyOptional({
    description: 'ID of the user sending the tokens (null for minting)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  senderId?: string;

  @ApiProperty({
    description: 'ID of the user receiving the tokens',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({
    description: 'Type of token being transferred',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  @IsEnum(TokenType)
  tokenType: TokenType;

  @ApiPropertyOptional({
    description: 'Token ID for NFTs (ERC721, ERC1155)',
    example: '42',
  })
  @IsString()
  @IsOptional()
  tokenId?: string;

  @ApiProperty({
    description: 'Contract address of the token',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsNotEmpty()
  tokenAddress: string;

  @ApiProperty({
    description: 'Amount of tokens being transferred (1 for ERC721 NFTs)',
    example: 10.5,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({
    description: 'Transaction hash from the blockchain',
    example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  @IsString()
  @IsOptional()
  txHash?: string;

  @ApiPropertyOptional({
    description: 'Blockchain where the transaction is being processed',
    default: 'ethereum',
    example: 'ethereum',
  })
  @IsString()
  @IsOptional()
  blockchain?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the transaction',
    example: { tokenName: 'Example Token', tokenSymbol: 'EXT' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// src/token-transactions/dto/update-token-transaction.dto.ts
import { IsEnum, IsOptional, IsString, IsNumber, IsPositive, IsDate } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTokenTransactionDto {
  @ApiPropertyOptional({
    description: 'Transaction hash from the blockchain',
    example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  @IsString()
  @IsOptional()
  txHash?: string;

  @ApiPropertyOptional({
    description: 'Status of the transaction',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Gas price in wei',
    example: 50000000000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  gasPrice?: number;

  @ApiPropertyOptional({
    description: 'Gas used by the transaction',
    example: 21000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  gasUsed?: number;

  @ApiPropertyOptional({
    description: 'Total transaction fee',
    example: 0.00105,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  transactionFee?: number;

  @ApiPropertyOptional({
    description: 'Block number where the transaction was included',
    example: 14000000,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  blockNumber?: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the block',
    example: '2023-04-15T10:30:00Z',
  })
  @IsDate()
  @IsOptional()
  blockTimestamp?: Date;

  @ApiPropertyOptional({
    description: 'Error message if the transaction failed',
    example: 'Out of gas',
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the transaction',
    example: { tokenName: 'Example Token', tokenSymbol: 'EXT' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// src/token-transactions/dto/token-transaction-filter.dto.ts
import { IsEnum, IsUUID, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TokenType } from '../enums/token-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TokenTransactionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by sender ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  senderId?: string;

  @ApiPropertyOptional({
    description: 'Filter by receiver ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  receiverId?: string;

  @ApiPropertyOptional({
    description: 'Filter by token type',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  @IsEnum(TokenType)
  @IsOptional()
  tokenType?: TokenType;

  @ApiPropertyOptional({
    description: 'Filter by token ID',
    example: '42',
  })
  @IsString()
  @IsOptional()
  tokenId?: string;

  @ApiPropertyOptional({
    description: 'Filter by token address',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsOptional()
  tokenAddress?: string;

  @ApiPropertyOptional({
    description: 'Filter by transaction status',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
  })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'Filter by blockchain',
    example: 'ethereum',
  })
  @IsString()
  @IsOptional()
  blockchain?: string;

  @ApiPropertyOptional({
    description: 'Filter by transactions created from this date',
    example: '2023-04-01T00:00:00Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by transactions created until this date',
    example: '2023-04-30T23:59:59Z',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;
}

// src/token-transactions/dto/token-transaction-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TokenType } from '../enums/token-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TokenTransactionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the token transaction',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'ID of the user sending the tokens',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  senderId?: string;

  @ApiPropertyOptional({
    description: 'Username of the sender',
    example: 'johndoe',
  })
  senderUsername?: string;

  @ApiProperty({
    description: 'ID of the user receiving the tokens',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  receiverId: string;

  @ApiPropertyOptional({
    description: 'Username of the receiver',
    example: 'janedoe',
  })
  receiverUsername?: string;

  @ApiProperty({
    description: 'Type of token being transferred',
    enum: TokenType,
    example: TokenType.ERC20,
  })
  tokenType: TokenType;

  @ApiPropertyOptional({
    description: 'Token ID for NFTs (ERC721, ERC1155)',
    example: '42',
  })
  tokenId?: string;

  @ApiProperty({
    description: 'Contract address of the token',
    example: '0x1234567890123456789012345678901234567890',
  })
  tokenAddress: string;

  @ApiProperty({
    description: 'Amount of tokens being transferred',
    example: 10.5,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Transaction hash from the blockchain',
    example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  txHash?: string;

  @ApiProperty({
    description: 'Status of the transaction',
    enum: TransactionStatus,
    example: TransactionStatus.CONFIRMED,
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Blockchain where the transaction is being processed',
    example: 'ethereum',
  })
  blockchain: string;

  @ApiPropertyOptional({
    description: 'Gas price in wei',
    example: 50000000000,
  })
  gasPrice?: number;

  @ApiPropertyOptional({
    description: 'Gas used by the transaction',
    example: 21000,
  })
  gasUsed?: number;

  @ApiPropertyOptional({
    description: 'Total transaction fee',
    example: 0.00105,
  })
  transactionFee?: number;

  @ApiPropertyOptional({
    description: 'Block number where the transaction was included',
    example: 14000000,
  })
  blockNumber?: number;

  @ApiPropertyOptional({
    description: 'Timestamp of the block',
    example: '2023-04-15T10:30:00Z',
  })
  blockTimestamp?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata for the transaction',
    example: { tokenName: 'Example Token', tokenSymbol: 'EXT' },
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Error message if the transaction failed',
    example: 'Out of gas',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'When the transaction record was created',
    example: '2023-04-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the transaction record was last updated',
    example: '2023-04-15T10:35:00Z',
  })
  updatedAt: Date;
}
