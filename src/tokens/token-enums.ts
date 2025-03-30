// src/token-transactions/enums/token-type.enum.ts
export enum TokenType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155'
}

// src/token-transactions/enums/transaction-status.enum.ts
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
  CANCELLED = 'CANCELLED'
}
