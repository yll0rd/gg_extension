// src/token/services/starknet.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as starknet from 'starknet';
import { uint256 } from 'starknet';
import { IStarknetProvider, ITokenTransfer, ITransactionResult, IToken } from '../interfaces';
import { Network, TokenType } from '../types/token.types';

@Injectable()
export class StarknetService implements IStarknetProvider {
  private readonly logger = new Logger(StarknetService.name);
  public network: Network;
  public provider: any;
  public account: any;

  // ERC20 ABI (simplified for readability)
  private readonly erc20Abi = [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'account', type: 'felt' }],
      outputs: [{ name: 'balance', type: 'Uint256' }],
      stateMutability: 'view',
    },
    {
      name: 'transfer',
      type: 'function',
      inputs: [
        { name: 'recipient', type: 'felt' },
        { name: 'amount', type: 'Uint256' },
      ],
      outputs: [{ name: 'success', type: 'felt' }],
    },
    {
      name: 'name',
      type: 'function',
      inputs: [],
      outputs: [{ name: 'name', type: 'felt' }],
      stateMutability: 'view',
    },
    {
      name: 'symbol',
      type: 'function',
      inputs: [],
      outputs: [{ name: 'symbol', type: 'felt' }],
      stateMutability: 'view',
    },
    {
      name: 'decimals',
      type: 'function',
      inputs: [],
      outputs: [{ name: 'decimals', type: 'felt' }],
      stateMutability: 'view',
    },
  ];

  // ERC721 ABI (simplified for readability)
  private readonly erc721Abi = [
    {
      name: 'balanceOf',
      type: 'function',
      inputs: [{ name: 'owner', type: 'felt' }],
      outputs: [{ name: 'balance', type: 'Uint256' }],
      stateMutability: 'view',
    },
    {
      name: 'ownerOf',
      type: 'function',
      inputs: [{ name: 'tokenId', type: 'Uint256' }],
      outputs: [{ name: 'owner', type: 'felt' }],
      stateMutability: 'view',
    },
    {
      name: 'safeTransferFrom',
      type: 'function',
      inputs: [
        { name: 'from', type: 'felt' },
        { name: 'to', type: 'felt' },
        { name: 'tokenId', type: 'Uint256' },
      ],
      outputs: [],
    },
  ];

  constructor(private configService: ConfigService) {
    this.network = this.configService.get<Network>('STARKNET_NETWORK') || Network.TESTNET;
  }

  /**
   * Connect to the Starknet network
   */
  async connect(): Promise<void> {
    try {
      // Initialize provider based on network
      switch (this.network) {
        case Network.MAINNET:
          this.provider = new starknet.Provider({ sequencer: { network: 'mainnet-alpha' } });
          break;
        case Network.TESTNET:
          this.provider = new starknet.Provider({ sequencer: { network: 'goerli-alpha' } });
          break;
        case Network.DEVNET:
          const nodeUrl = this.configService.get<string>('STARKNET_NODE_URL');
          this.provider = new starknet.Provider({ rpc: { nodeUrl } });
          break;
        default:
          this.provider = new starknet.Provider({ sequencer: { network: 'goerli-alpha' } });
      }

      // Initialize account if private key is provided
      const privateKey = this.configService.get<string>('STARKNET_PRIVATE_KEY');
      const accountAddress = this.configService.get<string>('STARKNET_ACCOUNT_ADDRESS');
      
      if (privateKey && accountAddress) {
        this.account = new starknet.Account(
          this.provider,
          accountAddress,
          privateKey
        );
        this.logger.log(`Connected to Starknet ${this.network} with account ${accountAddress}`);
      } else {
        this.logger.log(`Connected to Starknet ${this.network} in read-only mode`);
      }
    } catch (error) {
      this.logger.error(`Failed to connect to Starknet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get token balance for a user
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const contract = new starknet.Contract(this.erc20Abi, tokenAddress, this.provider);
      
      const { balance } = await contract.balanceOf(userAddress);
      return uint256.uint256ToBN(balance).toString();
    } catch (error) {
      this.logger.error(`Failed to get token balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user owns a specific NFT token
   */
  async ownsNFT(tokenAddress: string, userAddress: string, tokenId: string): Promise<boolean> {
    try {
      const contract = new starknet.Contract(this.erc721Abi, tokenAddress, this.provider);
      
      const { owner } = await contract.ownerOf(tokenId);
      return owner.toLowerCase() === userAddress.toLowerCase();
    } catch (error) {
      this.logger.error(`Failed to check NFT ownership: ${error.message}`);
      return false;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<IToken> {
    try {
      const contract = new starknet.Contract(this.erc20Abi, tokenAddress, this.provider);
      
      // Try to get basic ERC20 information
      const [nameResult, symbolResult, decimalsResult] = await Promise.allSettled([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      const name = nameResult.status === 'fulfilled' ? starknet.shortString.decodeShortString(nameResult.value.name) : 'Unknown Token';
      const symbol = symbolResult.status === 'fulfilled' ? starknet.shortString.decodeShortString(symbolResult.value.symbol) : 'UNKNOWN';
      const decimals = decimalsResult.status === 'fulfilled' ? parseInt(decimalsResult.value.decimals.toString()) : 18;

      // Determine token type based on available methods
      let isERC20 = nameResult.status === 'fulfilled' && symbolResult.status === 'fulfilled';
      let isERC721 = false;

      // Try to detect if it's an ERC721
      try {
        const erc721Contract = new starknet.Contract(this.erc721Abi, tokenAddress, this.provider);
        await erc721Contract.supportsInterface('0x80ac58cd'); // ERC721 interface ID
        isERC721 = true;
      } catch {
        // Not an ERC721
      }

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        network: this.network,
        isERC20,
        isERC721,
        isERC1155: false // Starknet doesn't have full ERC1155 support yet
      };
    } catch (error) {
      this.logger.error(`Failed to get token info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send tokens
   */
  async sendTokens(params: ITokenTransfer): Promise<ITransactionResult> {
    try {
      if (!this.account) {
        throw new Error('No account configured for sending transactions');
      }

      const { fromAddress, toAddress, tokenAddress, amount, tokenId, network } = params;
      
      // Verify the sender is our account
      if (fromAddress.toLowerCase() !== this.account.address.toLowerCase()) {
        throw new Error('Sender address does not match configured account');
      }

      // Handle different token types
      let calldata;
      let contract;

      if (tokenId) {
        // ERC721 transfer
        contract = new starknet.Contract(this.erc721Abi, tokenAddress, this.account);
        const tokenIdUint256 = uint256.bnToUint256(BigInt(tokenId));
        
        calldata = {
          from: fromAddress,
          to: toAddress,
          tokenId: tokenIdUint256,
        };
        
        const tx = await contract.safeTransferFrom(calldata.from, calldata.to, calldata.tokenId);
        
        return {
          success: true,
          transactionHash: tx.transaction_hash,
        };
      } else {
        // ERC20 transfer
        contract = new starknet.Contract(this.erc20Abi, tokenAddress, this.account);
        const amountUint256 = uint256.bnToUint256(BigInt(amount));
        
        const tx = await contract.transfer(toAddress, amountUint256);
        
        return {
          success: true,
          transactionHash: tx.transaction_hash,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to send tokens: ${error.message}`);
      return {
        success: false,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txHash: string): Promise<any> {
    try {
      return await this.provider.getTransaction(txHash);
    } catch (error) {
      this.logger.error(`Failed to get transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Wait for transaction to be confirmed
   */
  async waitForTransaction(txHash: string, options?: any): Promise<any> {
    try {
      return await this.provider.waitForTransaction(txHash, options);
    } catch (error) {
      this.logger.error(`Failed while waiting for transaction: ${error.message}`);
      throw error;
    }
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(transaction: any): Promise<any> {
    try {
      return await this.account.estimateFee(transaction);
    } catch (error) {
      this.logger.error(`Failed to estimate fee: ${error.message}`);
      throw error;
    }
  }
}
