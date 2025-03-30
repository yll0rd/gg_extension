// src/token/interfaces/token.interface.ts
export interface IToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  network: string;
  isERC20: boolean;
  isERC721: boolean;
  isERC1155: boolean;
}

// src/token/interfaces/token-balance.interface.ts
export interface ITokenBalance {
  tokenAddress: string;
  userAddress: string;
  balance: string;
  balanceFormatted: string;
  token: IToken;
}

// src/token/interfaces/token-transfer.interface.ts
export interface ITokenTransfer {
  fromAddress: string;
  toAddress: string;
  tokenAddress: string;
  amount: string;
  tokenId?: string;
  txHash?: string;
  network: string;
}

// src/token/interfaces/transaction-result.interface.ts
export interface ITransactionResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  errorMessage?: string;
  receipt?: any;
}

// src/token/types/token.types.ts
export enum TokenType {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155'
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
  CANCELLED = 'CANCELLED'
}

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet'
}

// src/token/interfaces/starknet-provider.interface.ts
export interface IStarknetProvider {
  network: Network;
  provider: any; // Starknet.js provider instance
  account?: any; // Starknet.js account instance
  connect(): Promise<void>;
  getTokenBalance(tokenAddress: string, userAddress: string): Promise<string>;
  sendTokens(params: ITokenTransfer): Promise<ITransactionResult>;
  getTransaction(txHash: string): Promise<any>;
  waitForTransaction(txHash: string, options?: any): Promise<any>;
  estimateTransactionFee(transaction: any): Promise<any>;
}
