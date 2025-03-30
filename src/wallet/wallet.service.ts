import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ec, hash, RpcProvider, Call } from 'starknet';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { User } from '../users/entities/user.entity';
import { WalletActivity } from './entities/wallet-activity.entity';

@Injectable()
export class WalletService {
  private starknetProvider: RpcProvider;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(WalletActivity)
    private readonly activityRepository: Repository<WalletActivity>, // ✅ Fixed Injection
  ) {
    this.starknetProvider = new RpcProvider({
      nodeUrl: 'https://starknet-mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    });
  }

  async verifyWalletSignature(
    walletAddress: string,
    signature: string,
    message: string,
  ): Promise<boolean> {
    try {
      if (!walletAddress.startsWith('0x')) {
        throw new BadRequestException('Invalid wallet address format');
      }

      // Hash the message
      const hashedMessage = hash.computeHashOnElements([message]);

      // Convert address to public key
      const starkKey = ec.starkCurve.getPublicKey(walletAddress);

      // Verify the signature
      const isValid = ec.starkCurve.verify(starkKey, hashedMessage, signature);

      if (!isValid) throw new BadRequestException('Invalid wallet signature');

      return true;
    } catch (error) {
      throw new BadRequestException(
        `Wallet verification failed: ${error.message}`,
      );
    }
  }

  async connectWallet(userId: string, walletAddress: string) {
    if (!walletAddress.startsWith('0x')) {
      throw new BadRequestException('Invalid wallet address format');
    }

    // const user = await this.userRepository.findOne({ where: { id: userId } });
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user) throw new NotFoundException('User not found');

    // const existingWallet = await this.walletRepository.findOne({
    //   where: { walletAddress },
    // });
    const existingWallet = await this.walletRepository
      .createQueryBuilder('wallet')
      .where('wallet.walletAddress = :walletAddress', { walletAddress })
      .getCount();
    if (existingWallet)
      throw new BadRequestException('Wallet already connected');

    const wallet = this.walletRepository.create({ walletAddress, user });
    return this.walletRepository.save(wallet);
  }

  async disconnectWallet(userId: string, walletAddress: string) {
    // const wallet = await this.walletRepository.findOne({
    //   where: { walletAddress },
    //   relations: ['user'],
    // });
    //Better performance
    const wallet = await this.walletRepository
      .createQueryBuilder('wallet')
      .innerJoin('wallet.user', 'user')
      .select(['wallet.id', 'wallet.walletAddress', 'user.id'])
      .where('wallet.walletAddress = :walletAddress', { walletAddress })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (!wallet || wallet.user.id !== userId) {
      throw new NotFoundException('Wallet not found or not owned by user');
    }

    await this.walletRepository.remove(wallet);
    return { message: 'Wallet disconnected successfully' };
  }

  async getWalletBalance(walletAddress: string) {
    if (!walletAddress.startsWith('0x')) {
      throw new BadRequestException('Invalid wallet address format');
    }

    // const wallet = await this.walletRepository.findOne({
    //   where: { walletAddress },
    // });
    const wallet = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('wallet.id')
      .where('wallet.walletAddress = :walletAddress', { walletAddress })
      .getOne();
    if (!wallet) throw new NotFoundException('Wallet not found');

    // ERC-20 contract call (Example: STRK token)
    const tokenAddress = '0x053c91253bc9682c04929ca02eed00baff4f39c6';
    const balanceCall: Call = {
      contractAddress: tokenAddress,
      entrypoint: 'balanceOf',
      calldata: [walletAddress],
    };

    try {
      const response = await this.starknetProvider.callContract(balanceCall);

      if (!response || !response.result || response.result.length === 0) {
        throw new Error('Invalid response from StarkNet');
      }

      const balance = parseInt(response.result[0], 16);
      return { walletAddress, balance };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch wallet balance: ${error.message}`,
      );
    }
  }

  async logActivity(
    walletId: string,
    type: 'deposit' | 'withdrawal' | 'transaction',
    amount: number,
    transactionHash?: string,
  ) {
    // const wallet = await this.walletRepository.findOne({
    //   where: { id: walletId },
    // });
    const walletExists = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('1')
      .where('wallet.id = :walletId', { walletId })
      .getExists();
    if (!walletExists) throw new NotFoundException('Wallet not found');

    const activity = this.activityRepository.create({
      wallet: { id: walletId },
      type,
      amount,
      transactionHash,
    });

    await this.activityRepository.save(activity);
  }

  async getWalletActivity(walletId: string) {
    return this.activityRepository.find({
      where: { wallet: { id: walletId } },
      order: { timestamp: 'DESC' },
    });
  }
}
