// src/token/entities/token-balance.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  Index 
} from 'typeorm';
import { UserTokenEntity } from './user-token.entity';

@Entity('token_balances')
export class TokenBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_address' })
  @Index()
  userAddress: string;

  @Column({ name: 'token_address' })
  @Index()
  tokenAddress: string;

  @Column({ name: 'balance', type: 'varchar' })
  balance: string;

  @Column({ name: 'block_number', nullable: true })
  blockNumber?: number;

  @Column({ name: 'block_timestamp' })
  @Index()
  blockTimestamp: Date;

  @Column({ name: 'user_token_id' })
  userTokenId: string;

  @ManyToOne(() => UserTokenEntity, userToken => userToken.balances)
  @JoinColumn({ name: 'user_token_id' })
  userToken: UserTokenEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// src/token/entities/user-token.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany, 
  Index 
} from 'typeorm';
import { TokenBalanceEntity } from './token-balance.entity';
import { Network } from '../types/token.types';

@Entity('user_tokens')
@Index(['userAddress', 'tokenAddress'], { unique: true })
export class UserTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_address' })
  @Index()
  userAddress: string;

  @Column({ name: 'token_address' })
  @Index()
  tokenAddress: string;

  @Column({ name: 'token_name' })
  tokenName: string;

  @Column({ name: 'token_symbol' })
  tokenSymbol: string;

  @Column({ name: 'token_decimals', default: 18 })
  tokenDecimals: number;

  @Column({ name: 'latest_balance', type: 'varchar', nullable: true })
  latestBalance?: string;

  @Column({ name: 'is_erc20', default: true })
  isERC20: boolean;

  @Column({ name: 'is_erc721', default: false })
  isERC721: boolean;

  @Column({ name: 'is_erc1155', default: false })
  isERC1155: boolean;

  @Column({ name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({
    name: 'network',
    type: 'enum',
    enum: Network,
    default: Network.MAINNET,
  })
  network: Network;

  @Column({ name: 'last_updated' })
  @Index()
  lastUpdated: Date;

  @Column({ name: 'token_metadata', type: 'jsonb', nullable: true })
  tokenMetadata?: Record<string, any>;

  @OneToMany(() => TokenBalanceEntity, tokenBalance => tokenBalance.userToken)
  balances: TokenBalanceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
