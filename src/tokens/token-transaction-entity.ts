// src/token-transactions/entities/token-transaction.entity.ts
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
import { User } from '../../users/entities/user.entity';
import { TokenType } from '../enums/token-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

@Entity('token_transactions')
export class TokenTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id', nullable: true })
  @Index()
  senderId: string;

  @ManyToOne(() => User, user => user.sentTokenTransactions)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id' })
  @Index()
  receiverId: string;

  @ManyToOne(() => User, user => user.receivedTokenTransactions)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({
    name: 'token_type',
    type: 'enum',
    enum: TokenType,
  })
  @Index()
  tokenType: TokenType;

  @Column({ name: 'token_id', nullable: true })
  @Index()
  tokenId: string;

  @Column({ name: 'token_address', nullable: false })
  tokenAddress: string;

  @Column({ name: 'amount', type: 'decimal', precision: 36, scale: 18, default: 0 })
  amount: number;

  @Column({ name: 'tx_hash', nullable: true, unique: true })
  @Index()
  txHash: string;

  @Column({
    name: 'status',
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  @Index()
  status: TransactionStatus;

  @Column({ name: 'blockchain', default: 'ethereum' })
  blockchain: string;

  @Column({ name: 'gas_price', type: 'decimal', precision: 36, scale: 18, nullable: true })
  gasPrice: number;

  @Column({ name: 'gas_used', type: 'integer', nullable: true })
  gasUsed: number;

  @Column({ name: 'transaction_fee', type: 'decimal', precision: 36, scale: 18, nullable: true })
  transactionFee: number;

  @Column({ name: 'block_number', nullable: true })
  blockNumber: number;

  @Column({ name: 'block_timestamp', nullable: true })
  blockTimestamp: Date;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
