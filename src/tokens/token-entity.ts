// src/token/entities/token-transaction.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  Index 
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { TokenType, TransactionStatus, Network } from '../types/token.types';

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_address' })
  @Index()
  fromAddress: string;

  @Column({ name: 'to_address' })
  @Index()
  toAddress: string;

  @Column({ name: 'token_address' })
  @Index()
  tokenAddress: string;

  @Column({
    name: 'token_type',
    type: 'enum',
    enum: TokenType,
  })
  @Index()
  tokenType: TokenType;

  @Column({ name: 'amount', type: 'varchar' })
  amount: string;

  @Column({ name: 'token_id', nullable: true })
  tokenId?: string;

  @Column({ name: 'transaction_hash', nullable: true, unique: true })
  @Index()
  transactionHash?: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @Index()
  status: TransactionStatus;

  @Column({
    name: 'network',
    type: 'enum',
    enum: Network,
    default: Network.MAINNET,
  })
  network: Network;

  @Column({ name: 'block_number', nullable: true })
  blockNumber?: number;

  @Column({ name: 'block_timestamp', nullable: true })
  blockTimestamp?: Date;

  @Column({ name: 'gas_price', nullable: true })
  gasPrice?: string;

  @Column({ name: 'gas_used', nullable: true })
  gasUsed?: string;

  @Column({ name: 'fee_paid', nullable: true })
  feePaid?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
